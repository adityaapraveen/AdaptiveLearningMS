from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId, json_util
import json
import os
from dotenv import load_dotenv
import jwt
from functools import wraps

load_dotenv()

app = Flask(__name__)
# Configure CORS to properly handle preflight requests
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True, "allow_headers": ["Authorization", "Content-Type"]}})

client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
db = client["adaptive_lms"]
content_collection = db["content"]
teacher_student_mapping = db["teacher_student_mapping"]

# Helper function to convert MongoDB data to JSON
def parse_json(data):
    return json.loads(json_util.dumps(data))

# Token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token is missing"}), 403

        if token.startswith('Bearer '):
            token = token.split(' ')[1]

        try:
            data = jwt.decode(token, os.getenv("SECRET_KEY", "fallback_secret"), algorithms=['HS256'])
            current_user = data["username"]
            user_role = data["role"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid"}), 401

        return f(current_user, user_role, *args, **kwargs)
    return decorated

@app.route('/')
def home():
    return jsonify({"message": "This is the Content Delivery Service"})

# Explicitly handle OPTIONS requests for CORS preflight
@app.route('/add-content', methods=['OPTIONS'])
def options_add_content():
    return '', 200

@app.route('/get-content', methods=['OPTIONS'])
def options_get_content():
    return '', 200

@app.route('/add-content', methods=['POST'])
@token_required
def add_content(current_user, user_role):
    if user_role != "teacher":
        return jsonify({"error": "Only teachers can add content"}), 403

    data = request.json
    required_fields = ["title", "subject", "level", "type", "content_url"]
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields"}), 400
    
    # Add teacher information to the content
    data["teacher_username"] = current_user
    
    try:
        result = content_collection.insert_one(data)
        created_content = data.copy()
        created_content["_id"] = str(result.inserted_id)
        return jsonify(created_content), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-content', methods=['GET'])
@token_required
def get_content(current_user, user_role):
    subject = request.args.get("subject")
    level = request.args.get("level")

    query = {}

    if subject:
        query["subject"] = subject
    if level:
        query["level"] = level

    try:
        if user_role == "student":
            # Get all teachers the student is mapped to
            teacher_mappings = list(teacher_student_mapping.find(
                {"student_username": current_user}
            ))
            teacher_usernames = [mapping["teacher_username"] for mapping in teacher_mappings]
            
            # Add teacher filter to query
            query["teacher_username"] = {"$in": teacher_usernames}
        elif user_role == "teacher":
            # Teachers can only see their own content
            query["teacher_username"] = current_user
        
        content_list = list(content_collection.find(query))
        
        for content in content_list:
            content["_id"] = str(content["_id"])
        
        return jsonify(content_list) if content_list else jsonify([]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/content/<content_id>', methods=['GET'])
@token_required
def get_specific_content(current_user, user_role, content_id):
    try:
        content = content_collection.find_one({"_id": ObjectId(content_id)})
        
        if not content:
            return jsonify({"error": "Content not found"}), 404
            
        # Check if user has access to this content
        if user_role == "student":
            # Check if student is mapped to the teacher who created this content
            mapping = teacher_student_mapping.find_one({
                "teacher_username": content["teacher_username"],
                "student_username": current_user
            })
            if not mapping:
                return jsonify({"error": "You don't have access to this content"}), 403
        elif user_role == "teacher" and content["teacher_username"] != current_user:
            return jsonify({"error": "You don't have access to this content"}), 403
            
        content["_id"] = str(content["_id"])
        return jsonify(content), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Generic OPTIONS handler for any route
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)