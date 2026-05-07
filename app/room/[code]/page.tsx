// Room page — handles both Lobby (waiting) and Game (playing) phases

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="panel-brutal p-8 text-center">
        <h2 className="font-display text-4xl mb-4">ROOM: {code}</h2>
        <p className="text-grey-dark">Game lobby — coming soon</p>
      </div>
    </main>
  );
}
