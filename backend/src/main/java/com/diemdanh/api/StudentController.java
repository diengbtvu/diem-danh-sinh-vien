package com.diemdanh.api;

import com.diemdanh.api.dto.BulkStudentsRequest;
import com.diemdanh.domain.StudentEntity;
import com.diemdanh.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
    private final StudentRepository studentRepository;

    @PostMapping("/bulk")
    public List<StudentEntity> bulk(@RequestBody BulkStudentsRequest request) {
        List<StudentEntity> entities = request.getStudents().stream().map(it -> {
            StudentEntity e = new StudentEntity();
            e.setMssv(it.getMssv());
            e.setMaLop(it.getMaLop());
            e.setHoTen(it.getHoTen());
            return e;
        }).toList();
        return studentRepository.saveAll(entities);
    }
}
