from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Face API Mock")

@app.post("/recognize")
async def recognize(image: UploadFile = File(...)):
    # Mock: derive MSSV from filename digits if present, else fixed.
    name = image.filename or "unknown.jpg"
    digits = ''.join([c for c in name if c.isdigit()])
    # Random student ID and name for mock data
    import random

    # Generate random 9-digit student ID
    random_id = ''.join([str(random.randint(0, 9)) for _ in range(9)])

    # Generate random Vietnamese name
    first_names = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương']
    middle_names = ['Văn', 'Thị', 'Minh', 'Hoàng', 'Thanh', 'Quang', 'Hữu', 'Đức', 'Anh', 'Tuấn', 'Thành', 'Xuân', 'Thu', 'Hạ', 'Đông']
    last_names = ['An', 'Bình', 'Cường', 'Dũng', 'Hùng', 'Khang', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Vinh', 'Yên',
                  'Lan', 'Linh', 'Mai', 'Nga', 'Oanh', 'Phương', 'Quỳnh', 'Thảo', 'Trang', 'Uyên', 'Vân', 'Xuân', 'Yến', 'Hương', 'Hà']

    random_name = f"{random.choice(first_names)} {random.choice(middle_names)} {random.choice(last_names)}"

    label = f"{digits or random_id}_{random_name}"
    # Random confidence between 0.75 and 0.98 (realistic range)
    confidence = round(random.uniform(0.75, 0.98), 2)
    return JSONResponse({"label": label, "confidence": confidence})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
