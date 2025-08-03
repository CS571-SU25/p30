#  Stud Sorter UI — MVP

Welcome to the MVP version of the **Stud Sorter UI**. This web interface is the first step toward a fully automated LEGO sorting machine. The MVP focuses on a simple but functional frontend that captures images of LEGO parts using a webcam, sends them to the Brickognize API for identification, and displays the results.

---

## Current Features

### Manual Sort Page

Allows user to take a picture with lego brick and find what piece it is.

### Automated Sort Page

Currently mocks live camera feed with video of legos moving across FOV. Connects to backend for image processing to find when a piece enters the fov to crop an area around it, detect what piece it is and then display the live result on the UI. 

Features that still need to be implemented:
- Sorting logic for which bin a certain peice should go into (Along with animation for highlighting bin).


## Stats Page 
Displays legos that have been identified during the session. 


---

## Running App

#### Clone Repo

```bash
git clone https://github.com/CS571-SU25/p30.git
cd p30
```

#### Build Docker Image and Start Services
```bash
docker compose up --build
```

#### Accessing App
Frontend: http://localhost:5173
Backend: http://localhost:5001

#### Stopping App
```bash
docker compose down
```
