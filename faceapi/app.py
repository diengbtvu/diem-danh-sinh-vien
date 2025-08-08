from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Face API Mock")

@app.post("/recognize")
async def recognize(image: UploadFile = File(...)):
    # Mock: derive MSSV from filename digits if present, else fixed.
    name = image.filename or "unknown.jpg"
    digits = ''.join([c for c in name if c.isdigit()])
    label = f"{digits or '000000000'}_MockUser"
    confidence = 0.93
    return JSONResponse({"label": label, "confidence": confidence})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
