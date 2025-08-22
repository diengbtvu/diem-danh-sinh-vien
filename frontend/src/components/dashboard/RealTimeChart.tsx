import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Skeleton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface ChartData {
  [key: string]: any;
}

interface RealTimeChartProps {
  data: ChartData[];
  type: 'line' | 'area' | 'bar' | 'pie';
  height?: number;
  loading?: boolean;
  animated?: boolean;
  colors?: string[];
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  data,
  type,
  height = 300,
  loading = false,
  animated = true,
  colors
}) => {
  const theme = useTheme();

  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  const chartColors = colors || defaultColors;

  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === 'number') {
      if (name.toLowerCase().includes('rate') || name.toLowerCase().includes('confidence')) {
        return `${value.toFixed(1)}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[4]
          }}
        >
          <Box sx={{ fontWeight: 600, mb: 1 }}>
            {label}
          </Box>
          {payload.map((entry: any, index: number) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: entry.color
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: entry.color,
                  borderRadius: '50%'
                }}
              />
              <span>{entry.name}: {formatTooltipValue(entry.value, entry.name)}</span>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box height={height} display="flex" alignItems="center" justifyContent="center">
        <Skeleton variant="rectangular" width="100%" height="80%" />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box
        height={height}
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="text.secondary"
      >
        No data available
      </Box>
    );
  }

  const chartComponent = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="hour"
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke={chartColors[0]}
              strokeWidth={2}
              dot={{ fill: chartColors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: chartColors[0], strokeWidth: 2 }}
              animationDuration={animated ? 1000 : 0}
            />
            <Line
              type="monotone"
              dataKey="averageConfidence"
              stroke={chartColors[1]}
              strokeWidth={2}
              dot={{ fill: chartColors[1], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: chartColors[1], strokeWidth: 2 }}
              animationDuration={animated ? 1000 : 0}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="date"
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="count"
              stackId="1"
              stroke={chartColors[0]}
              fill={chartColors[0]}
              fillOpacity={0.6}
              animationDuration={animated ? 1000 : 0}
            />
            <Area
              type="monotone"
              dataKey="acceptanceRate"
              stackId="2"
              stroke={chartColors[1]}
              fill={chartColors[1]}
              fillOpacity={0.6}
              animationDuration={animated ? 1000 : 0}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="date"
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="count"
              fill={chartColors[0]}
              radius={[4, 4, 0, 0]}
              animationDuration={animated ? 1000 : 0}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={animated ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.95 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <ResponsiveContainer width="100%" height={height}>
        {chartComponent()}
      </ResponsiveContainer>
    </motion.div>
  );
};
