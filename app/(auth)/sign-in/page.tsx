import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { signInAction } from "@/features/auth/server/actions";

export default function SignInPage() {
  return (
    <AuthShell
      title="登录 JobFlow"
      description="先把你的申请流收束到一个地方，再决定今天最该处理哪一份。"
      footer="推荐先用邮箱 + 密码开始。Phase 2/3 再逐步补更多登录方式和外部连接。"
    >
      <AuthForm mode="sign-in" action={signInAction} />
    </AuthShell>
  );
}
