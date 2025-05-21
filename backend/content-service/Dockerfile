# Use the official Python base image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the current directory contents into the container
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variables
ENV MONGO_URI=mongodb://mongodb:27017/
ENV SECRET_KEY=fallback_secret
ENV FLASK_APP=app.py
ENV FLASK_ENV=development

# Expose the port that the app will run on
EXPOSE 5001

# Run the app
CMD ["python", "app.py"]
