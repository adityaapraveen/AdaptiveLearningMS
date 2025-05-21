import bcrypt
import jwt
import datetime
import re  # for email validation
import random
import string
from flask import Flask, request, jsonify
from pymongo import MongoClient
from functools import wraps
from dotenv import load_dotenv
import os
import logging
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fallback_secret")

# MongoDB connection
client = MongoClient(os.getenv("MONGO_URI", "mongodb://mongodb:27017/"))
db = client["adaptive_lms"]
users_collection = db["users"]
teacher_student_mapping = db["teacher_student_mapping"]

# Setup logging
logging.basicConfig(level=logging.DEBUG)

def generate_teacher_code():
    """Generate a random 6-digit code for teachers"""
    return ''.join(random.choices(string.digits, k=6))

@app.route('/')
def home():
    return jsonify({"message": "This is the User Service"})


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")  

    # Check for valid role
    if not role or role not in ["student", "teacher", "admin"]:
        return jsonify({"error": "Invalid or missing role"}), 400

    # Check for valid email
    if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email address"}), 400

    # Ensure username and password exist
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    user_data = {
        "username": username,
        "email": email,
        "password": hashed_pw,
        "role": role
    }

    # Add teacher code if the user is a teacher
    if role == "teacher":
        user_data["teacher_code"] = generate_teacher_code()

    users_collection.insert_one(user_data)

    return jsonify({"message": "User registered successfully!"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"error": "Username/Password is invalid"}), 404

    if not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return jsonify({"error": "Username/Password is invalid"}), 401

    token = jwt.encode({
        "username": username,
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({"token": token})


# Decorator to protect routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token is missing"}), 403

        # Extract token if it starts with Bearer
        if token.startswith('Bearer '):
            token = token.split(' ')[1]

        try:
            # Decode the token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data["username"]
            user_role = data["role"]

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": "Token is invalid"}), 401

        return f(current_user, user_role, *args, **kwargs)

    return decorated


@app.route('/profile', methods=['GET'])
@token_required
def profile(current_user, user_role):
    user = users_collection.find_one({"username": current_user}, {"_id": 0, "password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # If the user is a teacher, ensure the teacher_code is included
    if user_role == "teacher" and "teacher_code" not in user:
        # Generate a new code if it doesn't exist
        teacher_code = generate_teacher_code()
        users_collection.update_one(
            {"username": current_user},
            {"$set": {"teacher_code": teacher_code}}
        )
        user["teacher_code"] = teacher_code
    
    return jsonify(user)

# token verification 
@app.route('/verify-token', methods=['GET'])
def verify_token():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "No token provided"}), 400
    
    # Extract token if it starts with Bearer
    if token.startswith('Bearer '):
        token = token.split(' ')[1]
    
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({"message": "Token is valid", "data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Token verification failed: {str(e)}"}), 400

@app.route('/teacher/code', methods=['GET'])
@token_required
def get_teacher_code(current_user, user_role):
    if user_role != "teacher":
        return jsonify({"error": "Only teachers can access this endpoint"}), 403
    
    teacher = users_collection.find_one({"username": current_user})
    if not teacher:
        return jsonify({"error": "Teacher not found"}), 404
    
    return jsonify({"teacher_code": teacher.get("teacher_code")})

@app.route('/teacher/code/regenerate', methods=['POST'])
@token_required
def regenerate_teacher_code(current_user, user_role):
    if user_role != "teacher":
        return jsonify({"error": "Only teachers can access this endpoint"}), 403
    
    new_code = generate_teacher_code()
    users_collection.update_one(
        {"username": current_user},
        {"$set": {"teacher_code": new_code}}
    )
    
    return jsonify({"message": "Teacher code regenerated successfully", "new_code": new_code})

@app.route('/student/join', methods=['POST'])
@token_required
def join_teacher(current_user, user_role):
    if user_role != "student":
        return jsonify({"error": "Only students can access this endpoint"}), 403
    
    data = request.json
    teacher_code = data.get("teacher_code")
    
    if not teacher_code:
        return jsonify({"error": "Teacher code is required"}), 400
    
    # Find teacher with the given code
    teacher = users_collection.find_one({"teacher_code": teacher_code, "role": "teacher"})
    if not teacher:
        return jsonify({"error": "Invalid teacher code"}), 404
    
    # Check if student is already mapped to this teacher
    existing_mapping = teacher_student_mapping.find_one({
        "teacher_username": teacher["username"],
        "student_username": current_user
    })
    
    if existing_mapping:
        return jsonify({"error": "You are already mapped to this teacher"}), 400
    
    # Create teacher-student mapping
    teacher_student_mapping.insert_one({
        "teacher_username": teacher["username"],
        "student_username": current_user,
        "joined_at": datetime.datetime.utcnow()
    })
    
    # Invalidate student's quiz cache
    try:
        quiz_service_url = os.getenv("QUIZ_SERVICE_URL", "http://quiz-service:5004")
        response = requests.post(f"{quiz_service_url}/invalidate-student-cache/{current_user}")
        if response.status_code != 200:
            logging.warning(f"Failed to invalidate quiz cache for student {current_user}: {response.text}")
    except Exception as e:
        logging.error(f"Error calling quiz service to invalidate cache: {str(e)}")
    
    return jsonify({"message": "Successfully joined teacher's class"})

@app.route('/teacher/students', methods=['GET'])
@token_required
def get_teacher_students(current_user, user_role):
    if user_role != "teacher":
        return jsonify({"error": "Only teachers can access this endpoint"}), 403
    
    students = list(teacher_student_mapping.find(
        {"teacher_username": current_user},
        {"_id": 0, "student_username": 1, "joined_at": 1}
    ))
    
    return jsonify({"students": students})

@app.route('/student/teachers', methods=['GET'])
@token_required
def get_student_teachers(current_user, user_role):
    if user_role != "student":
        return jsonify({"error": "Only students can access this endpoint"}), 403
    
    teachers = list(teacher_student_mapping.find(
        {"student_username": current_user},
        {"_id": 0, "teacher_username": 1, "joined_at": 1}
    ))
    
    return jsonify({"teachers": teachers})

@app.route('/student/unsubscribe', methods=['POST'])
@token_required
def unsubscribe_from_teacher(current_user, user_role):
    if user_role != "student":
        return jsonify({"error": "Only students can access this endpoint"}), 403
    
    data = request.json
    teacher_username = data.get("teacher_username")
    
    if not teacher_username:
        return jsonify({"error": "Teacher username is required"}), 400
    
    # Check if mapping exists
    mapping = teacher_student_mapping.find_one({
        "teacher_username": teacher_username,
        "student_username": current_user
    })
    
    if not mapping:
        return jsonify({"error": "You are not subscribed to this teacher"}), 404
    
    # Remove the mapping
    result = teacher_student_mapping.delete_one({
        "teacher_username": teacher_username,
        "student_username": current_user
    })
    
    if result.deleted_count == 0:
        return jsonify({"error": "Failed to unsubscribe from teacher"}), 500
    
    # Invalidate student's quiz cache
    try:
        quiz_service_url = os.getenv("QUIZ_SERVICE_URL", "http://quiz-service:5004")
        response = requests.post(f"{quiz_service_url}/invalidate-student-cache/{current_user}")
        if response.status_code != 200:
            logging.warning(f"Failed to invalidate quiz cache for student {current_user}: {response.text}")
    except Exception as e:
        logging.error(f"Error calling quiz service to invalidate cache: {str(e)}")
    
    return jsonify({"message": "Successfully unsubscribed from teacher"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
