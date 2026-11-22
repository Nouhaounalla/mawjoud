import "./globals.css";
import Header from "@/components/Header";
import { isSupabaseConfigured } from "@/lib/supabase";

// Title and description used by browsers and search engines.
export const metadata = {
  title: "Mawjoud - Trouvez votre médicament près de chez vous",
  description:
    "Recherchez un médicament par son nom ou son code à barres et trouvez les pharmacies les plus proches qui l'ont en stock.",
};

// Makes the page fit phone screens and colors the browser bar.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a8a5b",
};

// The layout wraps every page of the app.
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Header />

        {/* Shown only when .env.local is missing or incomplete */}
        {!isSupabaseConfigured && (
          <div className="bg-amber-100 px-4 py-3 text-center text-sm text-amber-900">
            Supabase n&apos;est pas configuré. Copiez <code>.env.local.example</code> vers{" "}
            <code>.env.local</code>, renseignez vos clés, puis relancez <code>npm run dev</code>.
          </div>
        )}

        <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>

        <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-brand-900/60">
          Les informations de stock sont indicatives. Appelez la pharmacie pour confirmer avant de
          vous déplacer.
        </footer>
      </body>
    </html>
  );
}
