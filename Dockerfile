# Base image
FROM node:14-alpine as build-step

# Add `/node_modules/.bin` to $PATH
ENV PATH /node_modules/.bin:$PATH

WORKDIR /

COPY src ./src
COPY public ./public

# Install frontend dependencies
COPY package.json ./
COPY package-lock.json ./

# Run the frontend build 
RUN npm install
RUN npm run build 

# Backend => 
FROM python:3.9 

COPY --from=build-step /build ./build

# Include all backend files 
ADD server/__init.py .
ADD server/__sql.py .
ADD server/datasets/2021-05.csv .
ADD server/datasets/2021-06.csv .
ADD server/datasets/2021-07.csv .
ADD server/datasets/Helsingin_ja_Espoon_kaupunkipyöräasemat_avoin.csv .

# Install backend dependencies
COPY server/requirements.txt requirements.txt
RUN python -m pip install -r requirements.txt

# Expose the port 
EXPOSE 3000

# Notify backend that we're on production
ENV PRODUCTION=True

# Run the app
# Use only 1 worker otherwise we get complications with socketio
CMD ["gunicorn", "-b", ":5000", "-w", "1", "-k", "gevent", "__init:app", "--threads", "1", "--worker-connections", "1000"]