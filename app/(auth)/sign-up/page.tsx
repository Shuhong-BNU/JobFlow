import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { signUpAction } from "@/features/auth/server/actions";

export default function SignUpPage() {
  return (
    <AuthShell
      title="创建你的 JobFlow"
      description="从第一份 Wishlist 到最后的 Offer，对所有申请建立统一看板。"
      footer="注册后会自动进入总览页。建议先录入 3 到 5 个正在推进的岗位，最容易感受到产品价值。"
    >
      <AuthForm mode="sign-up" action={signUpAction} />
    </AuthShell>
  );
}
