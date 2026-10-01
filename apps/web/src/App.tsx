import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "@/components/app-shell.tsx";
import { ForgotPasswordPage } from "@/pages/forgot-password.tsx";
import { FriendsPage } from "@/pages/friends.tsx";
import { GroupPage } from "@/pages/group.tsx";
import { GroupsPage } from "@/pages/groups.tsx";
import { HomePage } from "@/pages/home.tsx";
import { ProfilePage } from "@/pages/profile.tsx";
import { ResetPasswordPage } from "@/pages/reset-password.tsx";
import { SignInPage } from "@/pages/sign-in.tsx";
import { SignUpPage } from "@/pages/sign-up.tsx";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
