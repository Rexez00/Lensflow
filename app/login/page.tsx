import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  return <LoginForm next={searchParams.next ?? "/account"} />;
}
