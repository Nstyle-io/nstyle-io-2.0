import React from 'react';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import { CameraCapture } from '@/components/camera/CameraCapture';

export default function CameraPage() {
  return (
    <ResponsiveLayout>
      <CameraCapture />
    </ResponsiveLayout>
  );
}