import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Enter from './pages/Enter';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const UserDetail = lazy(() => import('./pages/UserDetail'));
const Bots = lazy(() => import('./pages/Bots'));
const BotDetail = lazy(() => import('./pages/BotDetail'));
const Requests = lazy(() => import('./pages/Requests'));
const Chat = lazy(() => import('./pages/Chat'));
const Broadcast = lazy(() => import('./pages/Broadcast'));
const Payments = lazy(() => import('./pages/Payments'));
const Plans = lazy(() => import('./pages/Plans'));
const BotPlans = lazy(() => import('./pages/BotPlans'));
const Promocodes = lazy(() => import('./pages/Promocodes'));
const Channels = lazy(() => import('./pages/Channels'));
const Templates = lazy(() => import('./pages/Templates'));
const Categories = lazy(() => import('./pages/Categories'));
const Ai = lazy(() => import('./pages/Ai'));
const Settings = lazy(() => import('./pages/Settings'));
const Security = lazy(() => import('./pages/Security'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Protected({ children }) {
  const { loading, admin } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading text="Sessiya tekshirilmoqda…" />;
  if (!admin) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/enter" element={<Enter />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="bots" element={<Bots />} />
          <Route path="bots/:bot" element={<BotDetail />} />
          <Route path="requests" element={<Requests />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:uid" element={<Chat />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="payments" element={<Payments />} />
          <Route path="plans" element={<Plans />} />
          <Route path="bot-plans" element={<BotPlans />} />
          <Route path="promocodes" element={<Promocodes />} />
          <Route path="channels" element={<Channels />} />
          <Route path="templates" element={<Templates />} />
          <Route path="categories" element={<Categories />} />
          <Route path="ai" element={<Ai />} />
          <Route path="settings" element={<Settings />} />
          <Route path="security" element={<Security />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
