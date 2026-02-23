import React from 'react';
import { Search, Menu, Bell, TrendingUp } from 'lucide-react';

const Index = () => {
  const categories = ["Politics", "Business", "Tech", "Tourism", "Health", "Sports"];
  
  return (
    <div className="min-h-screen bg-slate-50 font-serif">
      {/* Top Navigation */}
      <nav className="border-b bg-white px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6 cursor-pointer hover:text-blue-600" />
            <Search className="h-5 w-5 cursor-pointer text-gray-500" />
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
              Global Times <span className="text-blue-700">Rwanda</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-sans">Kigali, {new Date().toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 cursor-pointer text-gray-500" />
            <button className="bg-blue-700 text-white px-4 py-1 text-sm font-sans font-bold rounded hover:bg-blue-800">SUBSCRIBE</button>
          </div>
        </div>
        
        {/* Categories Bar */}
        <div className="max-w-7xl mx-auto mt-4 hidden md:flex justify-center gap-8 text-xs font-sans font-bold uppercase tracking-wider border-t pt-3 text-gray-600">
          {categories.map(cat => (
            <a key={cat} href={`#${cat}`} className="hover:text-blue-700 transition-colors">{cat}</a>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Main Headline */}
          <div className="lg:col-span-8 group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg mb-4">
              <img 
                src="https://images.unsplash.com/photo-1540331547168-8b63109225b7?auto=format&fit=crop&q=80&w=1200" 
                alt="Kigali Skyline" 
                className="w-full h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 bg-blue-700 text-white px-3 py-1 text-xs font-bold uppercase">Breaking News</div>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-3 group-hover:text-blue-800 transition-colors">
              New Trade Agreement Signed to Boost Rwandan Tech Exports to Regional Markets
            </h2>
            <p className="text-gray-600 text-lg mb-4 line-clamp-3">
              Government officials meet with regional partners in Kigali to solidify a framework that promises to reduce barriers for local software companies...
            </p>
            <div className="flex items-center text-xs text-gray-400 font-sans font-medium">
              <span>By Jean-Paul N.</span>
              <span className="mx-2">•</span>
              <span>4 Min Read</span>
            </div>
          </div>

          {/* Trending Sidebar */}
          <div className="lg:col-span-4 border-l pl-8 hidden lg:block">
            <div className="flex items-center gap-2 mb-6 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-sans font-bold uppercase tracking-tighter">Trending in Rwanda</h3>
            </div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="group cursor-pointer border-b pb-4 last:border-0">
                  <span className="text-3xl font-bold text-gray-200 block mb-1">0{i}</span>
                  <h4 className="font-bold text-md leading-snug group-hover:text-blue-700 transition-colors">
                    {i === 1 && "Visit Rwanda: New National Park Tourism Numbers Reach Record High"}
                    {i === 2 && "Kigali Innovation City Attracts $100M in New Venture Capital"}
                    {i === 3 && "How Local Coffee Farmers are Adapting to Climate Change"}
                    {i === 4 && "National Basketball League Finals Schedule Announced"}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* News Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex flex-col gap-3 group cursor-pointer">
              <img 
                src={`https://images.unsplash.com/photo-152${item}21312323-123123123?auto=format&fit=crop&q=80&w=400`} 
                alt="News thumb" 
                className="rounded-md h-48 w-full object-cover"
              />
              <span className="text-blue-700 text-xs font-bold uppercase font-sans">Latest</span>
              <h3 className="font-bold text-xl group-hover:underline">Modernizing Infrastructure: Kigali's Green Mobility Initiative Gains Momentum</h3>
            </div>
          ))}
        </section>
      </main>

      <footer className="bg-slate-900 text-white mt-12 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-black uppercase mb-4">Global Times <span className="text-blue-500">Rwanda</span></h2>
            <p className="text-gray-400 text-sm leading-relaxed">The premier source for news, culture, and business in the heart of Africa. Committed to journalistic integrity and local storytelling.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-blue-500">Quick Links</h4>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="hover:text-white cursor-pointer">About Us</li>
              <li className="hover:text-white cursor-pointer">Contact Editor</li>
              <li className="hover:text-white cursor-pointer">Advertise with Us</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase text-xs tracking-widest text-blue-500">Newsletter</h4>
            <div className="flex">
              <input type="email" placeholder="Email address" className="bg-slate-800 border-none px-4 py-2 text-sm w-full rounded-l focus:ring-1 focus:ring-blue-500" />
              <button className="bg-blue-600 px-4 py-2 text-sm font-bold rounded-r hover:bg-blue-700">JOIN</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;