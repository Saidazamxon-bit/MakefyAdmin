import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button, Empty } from '../components/ui';

export default function NotFound() {
  return <Empty icon={Compass} title="Sahifa topilmadi" text="Bunday bo'lim yo'q yoki manzil noto'g'ri." action={<Link to="/"><Button variant="primary">Bosh sahifa</Button></Link>} />;
}
