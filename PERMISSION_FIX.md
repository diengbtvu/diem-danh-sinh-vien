# Fix Lỗi Phân Quyền Attendance Detail Page

## Vấn Đề

**Hiện tượng**: Giảng viên tạo phiên điểm danh nhưng không có quyền xem chi tiết phiên đó.

**Nguyên nhân**: Frontend `AttendanceDetailPage.tsx` đang **hardcode** gọi API của ADMIN (`/api/admin/*`) cho tất cả users, bất kể role.

```typescript
// Code CŨ (SAI)
const response = await apiRequest(`/api/admin/sessions/${sessionId}`)
const response = await apiRequest(`/api/admin/attendances?${params}`)
const response = await apiRequest(`/api/admin/stats/${sessionId}`)
```

Khi giảng viên (role `GIANGVIEN`) truy cập, backend trả về **403 Forbidden** vì giảng viên không có quyền `ADMIN`.

## Giải Pháp

### 1. Detect User Role

Thêm logic để lấy role từ localStorage:

```typescript
const getUserRole = () => {
  try {
    const stored = localStorage.getItem('diemdanh_auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed?.role as string | undefined
    }
  } catch {
    return undefined
  }
  return undefined
}

const userRole = getUserRole()
const isAdmin = userRole === 'ADMIN'
const isTeacher = userRole === 'GIANGVIEN'
const apiPrefix = isAdmin ? '/api/admin' : isTeacher ? '/api/teacher' : '/api/admin'
```

### 2. Dynamic API Endpoints

Thay đổi các API calls để dùng đúng endpoint theo role:

#### Session Details
```typescript
// OLD: /api/admin/sessions/{sessionId}
// NEW: 
const response = await apiRequest(`${apiPrefix}/sessions/${sessionId}`)
```

#### Attendances
```typescript
// Admin: /api/admin/attendances?sessionId=...
// Teacher: /api/teacher/sessions/{sessionId}/attendances

if (isTeacher && sessionId) {
  endpoint = `${apiPrefix}/sessions/${sessionId}/attendances?${params}`
} else if (isAdmin) {
  if (sessionId) {
    params.append('sessionId', sessionId)
  }
  endpoint = `${apiPrefix}/attendances?${params}`
}
```

#### Statistics
```typescript
// Admin: /api/admin/stats/{sessionId}
// Teacher: /api/teacher/sessions/{sessionId}/stats

if (isTeacher) {
  endpoint = `${apiPrefix}/sessions/${sessionId}/stats`
} else if (isAdmin) {
  endpoint = `${apiPrefix}/stats/${sessionId}`
}
```

### 3. Permission-Based Actions

Giới hạn quyền edit/delete chỉ cho ADMIN:

```typescript
// Edit và Delete chỉ dành cho Admin
const updateAttendance = async () => {
  if (!editingAttendance || !isAdmin) return // Only admin can edit
  // ...
}

const deleteAttendance = async (id: string) => {
  if (!isAdmin) return // Only admin can delete
  // ...
}

// Hide action buttons for teachers
actions={isAdmin ? [
  { label: 'Chỉnh sửa', icon: <Edit />, onClick: (row) => setEditingAttendance(row) },
  { label: 'Xóa', icon: <Delete />, onClick: (row) => deleteAttendance(row.id) }
] : []}
```

## API Mapping

### ADMIN APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/sessions/{sessionId}` | GET | Get session details |
| `/api/admin/attendances?sessionId=...` | GET | Get all attendances (with optional sessionId filter) |
| `/api/admin/stats/{sessionId}` | GET | Get statistics for session |
| `/api/admin/students?maLop=...` | GET | Get students by class |
| `/api/admin/attendances/{id}` | PUT | Update attendance record |
| `/api/admin/attendances/{id}` | DELETE | Delete attendance record |

### TEACHER APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/teacher/sessions/{sessionId}` | GET | Get session details (only own sessions) |
| `/api/teacher/sessions/{sessionId}/attendances` | GET | Get attendances for session |
| `/api/teacher/sessions/{sessionId}/stats` | GET | Get statistics for session |
| `/api/teacher/students?maLop=...` | GET | Get students (only own classes) |

**Lưu ý**: Teacher chỉ có thể xem dữ liệu của các sessions/classes mà họ tạo, không có quyền edit/delete.

## Backend Implementation

Backend đã có sẵn phân quyền qua annotation:

```java
@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasRole('GIANGVIEN')")
public class TeacherController {
    
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionEntity> getSessionDetails(@PathVariable String sessionId) {
        String currentUsername = getCurrentUsername();
        // Verify session belongs to this teacher
        SessionEntity session = sessionRepository.findBySessionIdAndCreatedByUsername(sessionId, currentUsername);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }
    
    @GetMapping("/sessions/{sessionId}/attendances")
    public ResponseEntity<Map<String, Object>> getSessionAttendances(/* ... */) {
        // Similar verification
    }
    
    @GetMapping("/sessions/{sessionId}/stats")
    public ResponseEntity<Map<String, Object>> getSessionStats(/* ... */) {
        // Similar verification
    }
}
```

Backend tự động:
1. Kiểm tra role qua `@PreAuthorize("hasRole('GIANGVIEN')")`
2. Verify ownership qua `findBySessionIdAndCreatedByUsername()`
3. Chỉ trả về dữ liệu của teacher đó

## Testing

### Test với ADMIN account:
1. Login với account admin
2. Truy cập attendance detail page
3. ✅ Có thể xem, edit, delete

### Test với TEACHER account:
1. Login với account giảng viên
2. Tạo session điểm danh
3. Truy cập attendance detail page cho session đó
4. ✅ Có thể xem chi tiết
5. ✅ Không có nút Edit/Delete

### Test với TEACHER truy cập session của người khác:
1. Login với teacher A
2. Cố truy cập session của teacher B
3. ✅ Backend trả về 404 Not Found

## Files Changed

- `frontend/src/pages/AttendanceDetailPage.tsx` - Main fix
- `frontend/dist/*` - Rebuilt frontend

## Deployment

```bash
# Rebuild frontend
cd /root/Desktop/diem-danh-sinh-vien/frontend
npm run build

# No need to restart nginx (static files auto-updated)
```

## Related Issues

- Backend: `TeacherController.java` (line 33) - `@PreAuthorize("hasRole('GIANGVIEN')")`
- Backend: `AdminUserController.java` (line 32) - `@PreAuthorize("hasRole('ADMIN')")`

---

**Fixed Date**: 2025-10-07  
**Fixed By**: AI Assistant  
**Status**: ✅ RESOLVED