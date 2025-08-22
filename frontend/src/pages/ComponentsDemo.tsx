import React, { useState } from 'react';
import {
  Typography,
  Grid,
  Box,
  Stack,
  Divider,
  FormControlLabel,
  Switch,
  MenuItem
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  Save,
  Send,
  Download,
  Refresh,
  Delete,
  Edit,
  Visibility,
  Star,
  Favorite,
  Share,
  Settings
} from '@mui/icons-material';

import ProfessionalLayout from '../components/ProfessionalLayout';
import ProfessionalCard from '../components/ProfessionalCard';
import ProfessionalForm from '../components/forms/ProfessionalForm';
import ProfessionalTextField from '../components/forms/ProfessionalTextField';
import ProfessionalSelect from '../components/forms/ProfessionalSelect';
import ProfessionalButton, { 
  GradientButton, 
  GlassButton 
} from '../components/buttons/ProfessionalButton';

export default function ComponentsDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  const cityOptions = [
    { value: 'hcm', label: 'TP. Hồ Chí Minh', icon: <LocationOn /> },
    { value: 'hn', label: 'Hà Nội', icon: <LocationOn /> },
    { value: 'dn', label: 'Đà Nẵng', icon: <LocationOn /> },
    { value: 'ag', label: 'An Giang', icon: <LocationOn /> },
  ];

  const roleOptions = [
    { value: 'admin', label: 'Quản trị viên', description: 'Toàn quyền hệ thống' },
    { value: 'teacher', label: 'Giảng viên', description: 'Quản lý lớp học' },
    { value: 'student', label: 'Sinh viên', description: 'Tham gia điểm danh' },
  ];

  return (
    <ProfessionalLayout
      headerProps={{
        title: "Components Demo",
        subtitle: "Showcase các component professional",
        showActions: false
      }}
    >
      <Typography variant="h3" sx={{ mb: 4, textAlign: 'center', fontWeight: 700 }}>
        Professional UI Components
      </Typography>

      {/* Buttons Section */}
      <ProfessionalCard
        title="Professional Buttons"
        subtitle="Các loại button với hiệu ứng đẹp"
        sx={{ mb: 4 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Standard Buttons</Typography>
            <Stack spacing={2}>
              <ProfessionalButton variant="contained" icon={<Save />}>
                Contained Button
              </ProfessionalButton>
              <ProfessionalButton variant="outlined" icon={<Edit />}>
                Outlined Button
              </ProfessionalButton>
              <ProfessionalButton variant="text" icon={<Visibility />}>
                Text Button
              </ProfessionalButton>
              <ProfessionalButton 
                variant="contained" 
                loading 
                loadingText="Đang lưu..."
              >
                Loading Button
              </ProfessionalButton>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>Special Buttons</Typography>
            <Stack spacing={2}>
              <GradientButton icon={<Star />} glow>
                Gradient Button
              </GradientButton>
              <GlassButton icon={<Favorite />}>
                Glass Button
              </GlassButton>
              <ProfessionalButton 
                variant="contained" 
                color="success" 
                success 
                icon={<Send />}
                pulse
              >
                Success Button
              </ProfessionalButton>
              <ProfessionalButton 
                variant="outlined" 
                color="error" 
                icon={<Delete />}
                tooltip="Xóa dữ liệu"
              >
                Danger Button
              </ProfessionalButton>
            </Stack>
          </Grid>
        </Grid>
      </ProfessionalCard>

      {/* Form Components */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={6}>
          <ProfessionalForm
            title="Professional Form"
            subtitle="Form với validation và UX tốt"
            onSubmit={handleSubmit}
            loading={loading}
            success={success ? "Form đã được gửi thành công!" : null}
            variant="outlined"
          >
            <ProfessionalTextField
              label="Họ và tên"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              icon={<Person />}
              placeholder="Nhập họ và tên"
              required
            />

            <ProfessionalTextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              icon={<Email />}
              placeholder="example@email.com"
              success={formData.email.includes('@')}
              required
            />

            <ProfessionalTextField
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              icon={<Lock />}
              placeholder="Nhập mật khẩu"
              showPasswordToggle
              helpText="Mật khẩu phải có ít nhất 8 ký tự"
              required
            />

            <ProfessionalTextField
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              icon={<Phone />}
              placeholder="0123456789"
            />

            <ProfessionalSelect
              label="Thành phố"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value as string})}
              options={cityOptions}
              icon={<LocationOn />}
              searchable
            />

            <ProfessionalSelect
              label="Vai trò"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as string})}
              options={roleOptions}
              helperText="Chọn vai trò phù hợp"
            />

            <Stack direction="row" spacing={2}>
              <GradientButton
                type="submit"
                icon={<Save />}
                loading={loading}
                loadingText="Đang lưu..."
                sx={{ flex: 1 }}
              >
                Lưu thông tin
              </GradientButton>
              <ProfessionalButton
                variant="outlined"
                icon={<Refresh />}
                onClick={() => setFormData({
                  name: '', email: '', password: '', phone: '', city: '', role: ''
                })}
              >
                Reset
              </ProfessionalButton>
            </Stack>
          </ProfessionalForm>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            {/* Cards Demo */}
            <ProfessionalCard
              title="Standard Card"
              subtitle="Card với icon và actions"
              description="Đây là một professional card với đầy đủ tính năng"
              icon={<Settings />}
              status="active"
              statusLabel="Hoạt động"
              actions={
                <Stack direction="row" spacing={1}>
                  <ProfessionalButton size="small" icon={<Edit />}>
                    Sửa
                  </ProfessionalButton>
                  <ProfessionalButton 
                    size="small" 
                    variant="outlined" 
                    icon={<Share />}
                  >
                    Chia sẻ
                  </ProfessionalButton>
                </Stack>
              }
            />

            <ProfessionalCard
              title="Gradient Card"
              subtitle="Card với gradient background"
              description="Card này sử dụng gradient background để tạo hiệu ứng đẹp"
              icon={<Star />}
              variant="gradient"
              color="secondary"
              onClick={() => alert('Card clicked!')}
            />

            <ProfessionalCard
              title="Outlined Card"
              subtitle="Card với border màu"
              description="Card này có border màu để làm nổi bật"
              icon={<Favorite />}
              variant="outlined"
              color="error"
              status="warning"
              statusLabel="Cảnh báo"
            />

            <ProfessionalCard
              loading
              title="Loading Card"
              subtitle="Card đang loading"
            />
          </Stack>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Divider sx={{ mb: 3 }}>
          <Typography variant="h6">Quick Actions</Typography>
        </Divider>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          flexWrap="wrap"
          gap={2}
        >
          <ProfessionalButton icon={<Download />} tooltip="Tải xuống">
            Download
          </ProfessionalButton>
          <GradientButton icon={<Send />} tooltip="Gửi dữ liệu">
            Send
          </GradientButton>
          <GlassButton icon={<Share />} tooltip="Chia sẻ">
            Share
          </GlassButton>
          <ProfessionalButton 
            variant="outlined" 
            color="error" 
            icon={<Delete />}
            tooltip="Xóa"
          >
            Delete
          </ProfessionalButton>
        </Stack>
      </Box>
    </ProfessionalLayout>
  );
}
