#  Stud Sorter UI — MVP

Welcome to the MVP version of the **Stud Sorter UI**. This web interface is the first step toward a fully automated LEGO sorting machine. The MVP focuses on a simple but functional frontend that captures images of LEGO parts using a webcam, sends them to the Brickognize API for identification, and displays the results in a user-friendly format.

---

## 🚀 MVP Goals

- Access the user's webcam and capture a still image of a LEGO part.
- Send the image to the [Brickognize API](https://brickognize.com) for part identification.
- Display the result, including part name, ID, and image.
- Provide a clean, responsive UI that will later integrate with backend sorting logic.

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
