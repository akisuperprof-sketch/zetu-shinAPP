const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Extract CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  fs.mkdirSync('src/pages', { recursive: true });
  fs.writeFileSync('src/pages/LP.css', cssMatch[1]);
}

// Extract HTML inside body
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
let body = bodyMatch[1];

// Remove scripts inside body
body = body.replace(/<script>([\s\S]*?)<\/script>/g, '');

// Basic replacements
body = body
  .replace(/class="/g, 'className="')
  .replace(/for="/g, 'htmlFor="')
  .replace(/onclick="navToApp\('[^']+'\)"/g, 'onClick={() => navigate("/app")}')
  .replace(/onclick="scrollToId\('([^']+)'\)"/g, 'onClick={() => scrollToId("$1")}')
  .replace(/onclick="toggleTi\(this\)"/g, 'onClick={(e) => toggleTi(e.currentTarget)}')
  .replace(/onclick="captureLP\(\)"/g, 'onClick={captureLP}')
  .replace(/href="\/app"/g, 'onClick={(e) => { e.preventDefault(); navigate("/app"); }} href="#"')
  .replace(/<img(.*?)>/g, (match) => {
    if (!match.endsWith('/>')) return match.replace('>', ' />');
    return match;
  })
  .replace(/<br>/g, '<br />')
  .replace(/<br \/>/g, '<br />') // Just in case
  .replace(/<input(.*?)>/g, (match) => {
      if (!match.endsWith('/>')) return match.replace('>', ' />');
      return match;
  });

// Style replacement function
body = body.replace(/style="([^"]+)"/g, (match, styleString) => {
  const obj = {};
  styleString.split(';').forEach(rule => {
    rule = rule.trim();
    if (!rule) return;
    const parts = rule.split(':');
    if (parts.length < 2) return;
    let key = parts[0].trim();
    const value = parts.slice(1).join(':').trim();
    // camelCase the key
    key = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
    obj[key] = value;
  });
  return 'style={' + JSON.stringify(obj) + '}';
});

// HTML comments
body = body.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

const tsxCode = `
import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LP.css';

export default function LP() {
  const navigate = useNavigate();

  const scrollToId = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  }, []);

  const toggleTi = useCallback((el: HTMLElement) => {
    if (window.innerWidth <= 900) {
      el.classList.toggle('active');
      document.querySelectorAll('.ti').forEach(other => {
        if (other !== el) other.classList.remove('active');
      });
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).classList.contains('ti')) {
        document.querySelectorAll('.ti').forEach(t => t.classList.remove('active'));
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const captureLP = useCallback(async () => {
    // Screen capture implementation
    alert("Capture LP functionality from React is pending implementation.");
  }, []);

  return (
    <div className="lp-wrapper">
      ${body}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/LP.tsx', tsxCode);
