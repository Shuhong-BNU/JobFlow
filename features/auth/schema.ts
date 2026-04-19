import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("请输入有效邮箱地址。"),
  password: z.string().min(8, "密码至少 8 位。"),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(2, "姓名至少 2 个字符。").max(80, "姓名过长。"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export type AuthActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof SignUpInput | keyof SignInInput, string[]>>;
};
