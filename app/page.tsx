import ConvertForm from '@/components/ConvertForm';
import { Map } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Map size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              MapConvert
            </h1>
            <p className="text-lg text-zinc-600">
              Convert Google Maps links to Naver Map links instantly.
            </p>
          </div>
        </div>

        <ConvertForm />

        <footer className="pt-8 text-zinc-400 text-sm">
          <p>Perfect for travelers in Korea.</p>
        </footer>
      </div>
    </main>
  );
}
