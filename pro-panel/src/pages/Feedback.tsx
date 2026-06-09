import { useState } from 'react';

interface Review {
  id: string;
  devoteeName: string;
  avatarText: string;
  avatarBg: string;
  poojaName: string;
  date: string;
  rating: number;
  submittedTime: string;
  comment: string;
  flagged?: boolean;
}

export function Feedback() {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      devoteeName: 'Rajesh Kumar',
      avatarText: 'R',
      avatarBg: 'bg-tertiary-container text-on-tertiary-container',
      poojaName: 'Satyanarayana Pooja',
      date: '10 May 2026',
      rating: 5,
      submittedTime: 'Submitted 11 May 9:00 AM',
      comment: '"The pooja was conducted beautifully by Pt. Sharma Ji. The live stream quality was excellent and we could participate fully from Bangalore. The prasad also arrived on time. Highly recommended!"'
    },
    {
      id: '2',
      devoteeName: 'Priya Sharma',
      avatarText: 'P',
      avatarBg: 'bg-secondary-container text-on-secondary-container',
      poojaName: 'Ganapathi Homam',
      date: '10 May 2026',
      rating: 4,
      submittedTime: 'Submitted 10 May 6:30 PM',
      comment: '"Very well organized. The recording was available quickly after the pooja. Would have liked a better camera angle during the main ritual."'
    },
    {
      id: '3',
      devoteeName: 'Anand Reddy',
      avatarText: 'A',
      avatarBg: 'bg-[#e8def8] text-[#1d192b]',
      poojaName: 'Lakshmi Pooja',
      date: '08 May 2026',
      rating: 5,
      submittedTime: 'Submitted 09 May 10:15 AM',
      comment: '"Excellent experience. First time using Doshanivarana and very impressed with the seamless process from booking to delivery."'
    },
    {
      id: '4',
      devoteeName: 'Sunita Devi',
      avatarText: 'S',
      avatarBg: 'bg-[#f8bd00] text-white',
      poojaName: 'Navagraha Pooja',
      date: '07 May 2026',
      rating: 3,
      submittedTime: 'Submitted 07 May 4:00 PM',
      comment: '"The stream went offline for about 10 minutes in the middle of the pooja. Please ensure stable internet connection."'
    },
    {
      id: '5',
      devoteeName: 'Unknown User',
      avatarText: 'U',
      avatarBg: 'bg-surface-variant text-on-surface-variant',
      poojaName: 'Special Archana',
      date: '05 May 2026',
      rating: 1,
      submittedTime: 'Submitted 06 May 1:00 PM',
      comment: 'This feedback has been flagged by Admin for review',
      flagged: true
    }
  ]);

  const [poojaFilter, setPoojaFilter] = useState('All Poojas');
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const handleReset = () => {
    setPoojaFilter('All Poojas');
    setStarFilter(null);
  };

  const filteredReviews = reviews.filter(r => {
    const matchesPooja = poojaFilter === 'All Poojas' || r.poojaName === poojaFilter;
    const matchesStar = starFilter === null || r.rating === starFilter;
    return matchesPooja && matchesStar;
  });

  return (
    <div className="max-w-[1440px] mx-auto pb-12 font-sans relative">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-on-surface font-semibold mb-2">Devotee Feedback</h1>
          <p className="text-body-lg text-on-surface-variant font-medium">Read-only view — feedback for Sri Venkateswara Temple</p>
        </div>
        <div className="bg-surface-container py-2 px-4 rounded-full border border-outline-variant/30 flex items-center gap-2 text-on-surface-variant w-fit font-semibold text-xs">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span>View Only — Contact Admin to moderate feedback</span>
        </div>
      </div>

      {/* Summary Section Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 font-semibold">
        {/* Left: Overall Rating Card */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm border border-[#F0E6D2] p-6 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">star</span>
          </div>
          
          <div className="flex flex-col items-center text-center md:text-left md:items-start shrink-0">
            <div className="text-[64px] leading-none text-[#D4A017] font-bold mb-2 font-display">4.6</div>
            <div className="flex text-[#D4A017] mb-2 text-2xl gap-1">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
            </div>
            <p className="text-body-sm text-on-surface-variant font-medium">Based on 156 reviews</p>
          </div>
          
          <div className="w-full flex-grow flex flex-col gap-2 z-10 text-xs text-on-surface-variant">
            {/* 5 Stars */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center w-24 font-bold">
                <span className="material-symbols-outlined text-[#D4A017] text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
                5 stars
              </div>
              <div className="flex-grow h-2 bg-surface-variant rounded-full overflow-hidden flex">
                <div className="bg-[#D4A017] h-full w-[50%] rounded-full"></div>
              </div>
              <div className="w-20 text-right font-medium">78 reviews</div>
            </div>
            
            {/* 4 Stars */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center w-24 font-bold">
                <span className="material-symbols-outlined text-[#D4A017] text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
                4 stars
              </div>
              <div className="flex-grow h-2 bg-surface-variant rounded-full overflow-hidden flex">
                <div className="bg-[#D4A017] h-full w-[33%] rounded-full opacity-80"></div>
              </div>
              <div className="w-20 text-right font-medium">52 reviews</div>
            </div>

            {/* 3 Stars */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center w-24 font-bold">
                <span className="material-symbols-outlined text-[#D4A017] text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
                3 stars
              </div>
              <div className="flex-grow h-2 bg-surface-variant rounded-full overflow-hidden flex">
                <div className="bg-[#D4A017] h-full w-[11%] rounded-full opacity-60"></div>
              </div>
              <div className="w-20 text-right font-medium">18 reviews</div>
            </div>

            {/* 2 Stars */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center w-24 font-bold">
                <span className="material-symbols-outlined text-[#D4A017] text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
                2 stars
              </div>
              <div className="flex-grow h-2 bg-surface-variant rounded-full overflow-hidden flex">
                <div className="bg-[#D4A017] h-full w-[4%] rounded-full opacity-40"></div>
              </div>
              <div className="w-20 text-right font-medium">6 reviews</div>
            </div>

            {/* 1 Star */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center w-24 font-bold">
                <span className="material-symbols-outlined text-[#D4A017] text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
                1 star
              </div>
              <div className="flex-grow h-2 bg-surface-variant rounded-full overflow-hidden flex">
                <div className="bg-[#D4A017] h-full w-[2%] rounded-full opacity-20"></div>
              </div>
              <div className="w-20 text-right font-medium">2 reviews</div>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats */}
        <div className="lg:col-span-4 grid grid-rows-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-[#F0E6D2] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider text-[10px] mb-1">Total Reviews</span>
              <span className="text-headline-lg text-on-surface font-bold leading-none">156</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">forum</span>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-[#F0E6D2] p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider text-[10px] mb-1">This Month</span>
              <span className="text-headline-lg text-on-surface font-bold leading-none">24</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-[#F0E6D2] p-4 flex items-center justify-between bg-gradient-to-r from-surface-container-lowest to-[#fffbf0]">
            <div className="flex flex-col">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider text-[10px] mb-1">Average</span>
              <span className="text-headline-lg text-[#D4A017] font-bold leading-none">4.6 ★</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#fdf5e6] border border-[#f0e6d2] flex items-center justify-center text-[#D4A017]">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-[#F0E6D2] p-4 mb-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-4">
          <select 
            value={poojaFilter}
            onChange={(e) => setPoojaFilter(e.target.value)}
            className="rounded-full border border-outline-variant bg-transparent py-2 pl-4 pr-10 font-button text-button text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer font-bold"
          >
            <option value="All Poojas">All Poojas</option>
            <option value="Satyanarayana Pooja">Satyanarayana Pooja</option>
            <option value="Ganapathi Homam">Ganapathi Homam</option>
            <option value="Lakshmi Pooja">Lakshmi Pooja</option>
            <option value="Navagraha Pooja">Navagraha Pooja</option>
          </select>
          
          <div className="flex items-center border border-outline-variant rounded-full overflow-hidden h-[38px] font-bold text-xs">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star}
                type="button"
                onClick={() => setStarFilter(starFilter === star ? null : star)}
                className={`px-3 h-full flex items-center justify-center border-r last:border-r-0 border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer ${
                  starFilter === star ? 'bg-[#ffeae1] text-primary' : 'text-on-surface-variant'
                }`}
              >
                {star}★
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3 font-semibold">
          <button 
            onClick={handleReset}
            className="text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-full transition-colors cursor-pointer font-bold text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Feedback Cards List */}
      <div className="flex flex-col gap-4 mb-8 font-sans">
        {filteredReviews.map(review => {
          if (review.flagged) {
            return (
              <div key={review.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                  <div className="bg-surface-container-lowest border border-outline-variant px-6 py-4 rounded-xl shadow-lg flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 text-error mb-1">
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                      <span className="font-display text-headline-sm font-bold">Feedback Hidden</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant font-bold">This feedback has been flagged by Admin for review</p>
                  </div>
                </div>
                
                <div className="opacity-20 pointer-events-none select-none font-semibold">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">U</div>
                      <div>
                        <h3 className="font-display text-headline-sm text-on-surface">Unknown User</h3>
                        <p className="text-label-md text-on-surface-variant">Special Archana • 05 May 2026</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface">[Content Hidden]</p>
                </div>
              </div>
            );
          }

          return (
            <div key={review.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-[#F0E6D2] p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2 font-semibold">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-headline-sm font-bold ${review.avatarBg}`}>
                    {review.avatarText}
                  </div>
                  <div>
                    <h3 className="font-display text-headline-sm text-on-surface font-bold">{review.devoteeName}</h3>
                    <p className="text-label-md text-on-surface-variant">{review.poojaName} • {review.date}</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:items-end">
                  <div className="flex text-[#D4A017] mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span 
                        key={s} 
                        className="material-symbols-outlined text-lg" 
                        style={{ fontVariationSettings: s <= review.rating ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-medium">{review.submittedTime}</span>
                </div>
              </div>
              
              <p className="text-body-md text-on-surface font-semibold italic">
                {review.comment}
              </p>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="bg-surface-container-lowest border border-[#F0E6D2] p-12 text-center rounded-xl text-on-surface-variant font-semibold">
            No feedback found matching filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-surface-container-lowest rounded-xl border border-[#F0E6D2] p-4 gap-4 font-semibold text-body-sm">
        <span className="text-on-surface-variant">Showing 1–{filteredReviews.length} of 156 reviews</span>
        <div className="flex items-center gap-2">
          <button disabled className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low cursor-pointer disabled:opacity-40">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">1</button>
          <button className="w-8 h-8 rounded-full hover:bg-surface-container-low text-on-surface flex items-center justify-center cursor-pointer">2</button>
          <button className="w-8 h-8 rounded-full hover:bg-surface-container-low text-on-surface flex items-center justify-center cursor-pointer">3</button>
          <span className="text-on-surface-variant">...</span>
          <button className="w-8 h-8 rounded-full hover:bg-surface-container-low text-on-surface flex items-center justify-center cursor-pointer">32</button>
          <button className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-low cursor-pointer">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

    </div>
  );
}
