import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*");

  return (
    <main>
      <h1>Supabase Connection Test</h1>
      {error ? (
        <p style={{ color: "red" }}>❌ Error: {error.message}</p>
      ) : (
        <p style={{ color: "green" }}>
          ✅ Connected! Profiles count: {data?.length ?? 0}
        </p>
      )}
    </main>
  );
}
