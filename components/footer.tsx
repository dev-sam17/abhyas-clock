import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Created with{" "}
          <Heart className="inline size-4 text-red-500 fill-red-500" /> by{" "}
          <a
            href="https://devsam.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Dev Sam
          </a>{" "}
          for all aspirants
        </p>
        <p className="text-sm text-muted-foreground">
          © 2025 Abhyas Clock. Built for students, by students.
        </p>
      </div>
    </footer>
  );
}
