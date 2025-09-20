export default function LayoutDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="sm:flex">
        <div className="bg-red-300 w-full max-w-[240px] hidden sm:block">
          <div className="bg-blue-400 px-4">
            {" "}
            <div className="bg-white">
              {" "}
              <p>How are you doing</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-300 h-screen  w-full">{children}</div>
      </div>
    </>
  );
}
