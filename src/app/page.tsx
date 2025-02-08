import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <nav>
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/projects">Projects</Link></li>
          <li><Link href="/life">Life</Link></li>
          <li><Link href="/cv">CV</Link></li>
          {/* Uncomment if needed */}
          {/* <li><Link href="/HitRanger">HitRanger</Link></li> */}
          {/* <li><Link href="/goalplay">Goalplay</Link></li> */}
        </ul>
      </nav>

      <h1>Welcome to My Next.js Site</h1>
      <p>Select a page from the navigation.</p>
    </div>
  );
}