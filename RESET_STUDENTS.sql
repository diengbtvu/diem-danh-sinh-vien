-- Script to reset all students data
-- Use this carefully! This will DELETE ALL students

-- Step 1: Backup current data (optional)
-- CREATE TABLE students_backup AS SELECT * FROM students;

-- Step 2: Delete all students
TRUNCATE TABLE students;

-- Step 3: Verify deletion
SELECT COUNT(*) as total_students FROM students;

-- Now you can import fresh CSV via Admin Dashboard
-- Format: MSSV,Họ tên,Mã lớp
-- Example:
-- 024101030,Vo Hoang Khac Bao,IT4409
-- 024101053,Nguyen Huynh Bao Anh,IT4409
