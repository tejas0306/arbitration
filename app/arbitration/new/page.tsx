import { Metadata } from 'next';
import ArbitrationForm from '@/components/arbitration-form';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';
import ArbitrationFormPage from '@/components/arbitration-form-page';

export const metadata: Metadata = {
  title: 'New Arbitration Request',
  description: 'Submit a new arbitration request',
};

export default function NewArbitrationPage() {
  return <ArbitrationFormPage />;
} 