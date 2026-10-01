import ResetForm from "@/components/ResetForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Choose a new password · Simple Lens" };

export default function ResetPassword({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>New password</b></div>
      <ResetForm token={searchParams.token ?? ""} />
    </>
  );
}
