import ForgotForm from "@/components/ForgotForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Forgot password · Simple Lens" };

export default function ForgotPassword() {
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>Forgot password</b></div>
      <ForgotForm />
    </>
  );
}
