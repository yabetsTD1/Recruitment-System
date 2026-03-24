"use client";

import Link from "next/link";

export default function Navbar() {

  return (
    <nav style={{background:"#111",color:"#fff",padding:"10px"}}>
      <Link href="/">Home</Link> |
      <Link href="/dashboard"> Dashboard</Link>
    </nav>
  );
}