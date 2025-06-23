import base64
import json
import requests
import random
import os
import subprocess
import io
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf2image import convert_from_path
from together import Together  # Ensure you have this module installed
import cv2, tempfile
from skimage.metrics import structural_similarity as ssim
from moviepy.video.io.VideoFileClip import VideoFileClip
from faster_whisper import WhisperModel
import re

app = Flask(__name__)
CORS(app)

# --------------------------
# Configuration
# --------------------------


OPENROUTER_API_KEY = "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"
TOGETHER_API_KEY = "094ad5f71e654a605fb914359d9cda2f11e66f55e00d8d9ffc416d90d11fd723"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize Together API client
together_client = Together(api_key=TOGETHER_API_KEY)


# --------------------------
# Helper Functions
# --------------------------
def convert_ppt_to_pdf(ppt_path, pdf_path):
    """Convert PPTX/PPT to PDF using unoconv (Linux)"""
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, ppt_path], check=True)

def convert_docx_to_pdf(docx_path, pdf_path):
    """Convert DOCX/DOC to PDF using unoconv"""
    subprocess.run(["unoconv", "-f", "pdf", "-o", pdf_path, docx_path], check=True)

def convert_pdf_to_images(pdf_path):
    """Convert all pages of a PDF to a list of Base64-encoded PNG images."""
    print("Converting PDF to images...")
    images = convert_from_path(pdf_path)
    image_data_urls = []
    for i, image in enumerate(images):
        temp_image_path = f"temp_page_{i+1}.png"
        image.save(temp_image_path, "PNG")
        with open(temp_image_path, "rb") as img_file:
            base64_image = base64.b64encode(img_file.read()).decode("utf-8")
            image_data_urls.append(f"data:image/png;base64,{base64_image}")
        os.remove(temp_image_path)
    return image_data_urls

def get_image(image_path: str) -> str:
    """Convert an image file to a Base64-encoded Data URL."""
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{base64_image}"

def analyze_with_openrouter(prompt_text, image_data_url):
    """Call OpenRouter with a given prompt and image URL."""
    print("Calling OpenRouter with prompt:", prompt_text)
    response = requests.post(
        url=OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": "mistralai/mistral-small-3.2-24b-instruct:free",
            "messages": [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ]}
            ],
        }),
    )
    try:
        result = response.json()
        print("OpenRouter response:", result)
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print("Error in OpenRouter response:", e)
        return f"Error processing: {e}"
    


def process_video_file(file_obj):
    """
    Process an uploaded video file:
      - Extract keyframe descriptions (using OpenRouter for frame analysis)
      - Perform audio transcription (using Whisper)
    Returns a dictionary with the results.
    """
    # Save the video file locally
    filename = file_obj.filename
    local_path = f"./{filename}"
    file_obj.save(local_path)

    

    # Helper: convert a frame to a base64-encoded JPEG data URL
    def frame_to_base64(frame):
        _, buffer = cv2.imencode('.jpg', frame)
        base64_image = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_image}"

    # Helper: get a description of a frame by calling OpenRouter
    def get_image_description(image_data_url):
        TEXT = "Describe this frame in detail."
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "mistralai/mistral-small-3.1-24b-instruct:free",
                "messages": [
                    {"role": "user", "content": [
                        {"type": "text", "text": TEXT},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ]}
                ],
            }),
        )
        try:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error in image description: {e}"

    # Open the video using OpenCV
    cap = cv2.VideoCapture(local_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * 2)  # process a frame every 2 seconds
    prev_gray = None
    ssim_threshold = 0.8
    keyframe_descriptions = []
    frame_num = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_num % frame_interval == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            if prev_gray is None:
                image_data_url = frame_to_base64(frame)
                desc = get_image_description(image_data_url)
                keyframe_descriptions.append(desc)
                prev_gray = gray
            else:
                score, _ = ssim(prev_gray, gray, full=True)
                if score < ssim_threshold:
                    image_data_url = frame_to_base64(frame)
                    desc = get_image_description(image_data_url)
                    keyframe_descriptions.append(desc)
                    prev_gray = gray
        frame_num += 1
    cap.release()

    # --- Audio Transcription ---
    video_clip = VideoFileClip(local_path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
        video_clip.audio.write_audiofile(temp_audio.name, logger=None)
        temp_audio_path = temp_audio.name

    model = WhisperModel("medium")
    result, _ = model.transcribe(temp_audio_path)
    transcription = " ".join([segment.text for segment in result])
    os.remove(temp_audio_path)
    os.remove(local_path)

    # Return the combined video analysis results
    return {
        "keyframe_descriptions": keyframe_descriptions,
        "audio_transcription": transcription
    }



def process_file(file_obj, file_type):
    """
    Process the uploaded file based on its type.
    Returns the extracted text (solution) as a single string.
    """
    # Save the file locally
    filename = file_obj.filename
    local_path = f"./{filename}"
    file_obj.save(local_path)
    extracted_texts = []  # to accumulate responses

    try:
        if file_type == "ppt":
            pdf_path = local_path.rsplit('.', 1)[0] + ".pdf"
            convert_ppt_to_pdf(local_path, pdf_path)
            os.remove(local_path)
            image_urls = convert_pdf_to_images(pdf_path)
            os.remove(pdf_path)
            prompt_text = ("Extract all the details in this slide line by line if it is text and describe what "
                           "the images show if any in detail. Don't include any information irrelevant to the main slide content.")
            for img_url in image_urls:
                extracted_texts.append(analyze_with_openrouter(prompt_text, img_url))
        elif file_type == "pdf":
            pdf_path = local_path
            image_urls = convert_pdf_to_images(pdf_path)
            os.remove(pdf_path)
            prompt_text = ("Extract all the details in this page line by line if it is text and describe images if any "
                           "in detail. Don't include any information irrelevant to the main page content.")
            for img_url in image_urls:
                extracted_texts.append(analyze_with_openrouter(prompt_text, img_url))
        elif file_type == "docx":
            pdf_path = local_path.rsplit('.', 1)[0] + ".pdf"
            convert_docx_to_pdf(local_path, pdf_path)
            os.remove(local_path)
            image_urls = convert_pdf_to_images(pdf_path)
            os.remove(pdf_path)
            prompt_text = ("Extract all details in this page line by line if text, and describe images if any in detail. "
                           "Don't include any information irrelevant to the main page content.")
            for img_url in image_urls:
                extracted_texts.append(analyze_with_openrouter(prompt_text, img_url))
        elif file_type == "image":
            image_path = local_path
            image_data_url = get_image(image_path)
            os.remove(image_path)
            prompt_text = ("What's in this image? Don't include any information irrelevant to the main content.")
            extracted_texts.append(analyze_with_openrouter(prompt_text, image_data_url))
        elif file_type == "video":
            # Process the video using the helper function
            result = process_video_file(file_obj)
            # Format the output similar to the other file types
            keyframes_text = "Keyframe Descriptions:\n" + "\n".join(result.get("keyframe_descriptions", []))
            audio_text = "Audio Transcription:\n" + result.get("audio_transcription", "")
            extracted_texts.append(keyframes_text)
            extracted_texts.append(audio_text)
        else:
            return None, f"Unsupported file type: {file_type}"
    except Exception as e:
        return None, f"Error processing file: {e}"

    # Join multiple responses (if any) into a single string
    solution_text = "\n".join(extracted_texts)
    return solution_text, None

def process_text(solution):
    """
    Calls the evaluation logic using the Together API.
    Returns the parsed evaluation result.
    """
    
    print("first call to llama", solution)
    prompt = '''The following text describes a skill/ project/ achievement of a user. From the above text, analyse the various skills possessed by the user and give them a score from 1 to 10. Your answer should be a list of the following format:
    [
  { "title": "React", "category": "Frontend", "strength": 9 },
  { "title": "Tailwind CSS", "category": "Frontend", "strength": 8 },
  { "title": "Node.js", "category": "Backend", "strength": 8 },
  { "title": "Express.js", "category": "Backend", "strength": 7 },
  { "title": "PostgreSQL", "category": "Database", "strength": 7 },
  { "title": "Docker", "category": "DevOps", "strength": 6 }
]

The various categories are: Frontend, Backend, Database, DevOps, Mobile, AI/ML, Design, Soft Skills
Do not return any additional text. Only the final json.
Text :
''' + solution

    response = together_client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages=[{"role": "user", "content": prompt}],
    )
    ans = response.choices[0].message.content
    print(ans)

    match = re.search(r"\[(\s*{.*?}\s*)\]", ans, re.DOTALL)
    if match:
        skills_list = "[" + match.group(1) + "]"
        prompt2 = "This is the list of skills of the user:" + skills_list + '''
        Organize them into a hierarchical skill tree as a nested JSON object grouped by category. Each category should be a node with a `title` and `children`, and each skill under it should be a child node with `title` and `strength`. Use this format:

        {
        "title": "Skills",
        "strength": 8,
        "children": [
            {
            "title": "Frontend",
            "strength": 7,
            "children": [
                { "title": "React", "strength": 8 },
                ...
            ]
            },
            ...
        ]
        } 
        Do not return any additional text. Only the final json.'''
        response = together_client.chat.completions.create(
            model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            messages=[{"role": "user", "content": prompt2}],
        )
        ans = response.choices[0].message.content
        print(ans)
        match = re.search(r'{[\s\S]*}', ans.strip())
        try:
            js = json.loads(match.group())
        except:
            import ast
            js2 = ast.literal_eval(skills_list)
        try:
            js2 = json.loads(skills_list)
        except:
            import ast
            js2 = ast.literal_eval(skills_list)
        return {"tree": js, "list": js2}
        

# --------------------------
# Endpoints
# --------------------------
# Existing analysis endpoints (kept for direct testing)
@app.route("/analyze_ppt", methods=["POST"])
def analyze_ppt():
    if "ppt" not in request.files:
        return jsonify({"error": "No PPT file provided"}), 400

    solution, err = process_file(request.files["ppt"], "ppt")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/analyze_pdf", methods=["POST"])
def analyze_pdf():
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    solution, err = process_file(request.files["pdf"], "pdf")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/analyze_docx", methods=["POST"])
def analyze_docx():
    if "docx" not in request.files:
        return jsonify({"error": "No DOCX file provided"}), 400

    solution, err = process_file(request.files["docx"], "docx")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/analyze_image", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    solution, err = process_file(request.files["image"], "image")
    if err:
        return jsonify({"error": err}), 500
    return jsonify({"extracted_text": solution})

@app.route("/submit", methods=["POST"])
def submit():
    # Expecting:
    # - a file in request.files with key "file"
    # - form field "fileType" (one of: ppt, pdf, docx, image)
    # - form fields "theme" and "criteria" (criteria as a JSON string)
    # - optional: teamName 
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file_obj = request.files["file"]
    file_type = request.form.get("filet")
    

    
    if not file_type:
        return jsonify({"error": "Missing required fields: fileType"}), 400
    # Process the file based on type and extract text
    solution_text, err = process_file(file_obj, file_type)
    if err:
        return jsonify({"error": err}), 500
    
    # Call evaluation logic using the extracted text as the solution
    eval_result = process_text(solution_text)
    
    
    # Construct the new JSON structure
    
    
    # Populate criteriaScores and justification
    # if eval_result.get('scores'):
    #     for criterion, score_info in eval_result['scores'].items():
           
    #             submission_data['criteriaScores'][criterion] = int(score_info[0].split('/')[0])
    #             submission_data['justification'][criterion] = score_info[1]
          
    # score = 0
    # for c in criteria_dict:
    #     category = c['name']
    #     score += submission_data['criteriaScores'][category] * c['weightage']
    # submission_data['score'] = score//10
    # name_without_ext = os.path.splitext(file_obj.filename)[0]
    # file_name = f"submission_{name_without_ext}_{submission_data['hackathonId']}.json"
    # result_bytes = json.dumps(submission_data).encode("utf-8")
    
    
    return jsonify(eval_result)


# --------------------------
# Run the Application
# --------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
