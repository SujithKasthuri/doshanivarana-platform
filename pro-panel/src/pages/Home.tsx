import { Link, useNavigate } from 'react-router';

export function Home() {
  const navigate = useNavigate();

  const handleStartStream = (id: string) => {
    navigate(`/stream-readiness/${id}`);
  };

  const handleAssignPujari = (id: string) => {
    navigate(`/bookings/${id}`);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-xl min-h-[calc(100vh-104px)] relative mandala-watermark">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-headline-lg text-on-surface font-semibold mb-2">
          Good Morning, Ravi 👋
        </h1>
        <p className="font-sans text-body-lg text-on-surface-variant font-medium">
          {today}
        </p>
      </div>

      {/* Alert Banner */}
      <div className="mb-8 bg-[#FFF4E5] border border-[#FFB266] rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-[#B06000]">
          <span className="material-symbols-outlined flex items-center justify-center">warning</span>
          <span className="font-sans text-body-md font-semibold">5 parcels are packed and awaiting dispatch.</span>
        </div>
        <Link 
          to="/deliveries" 
          className="font-sans text-button text-[#B06000] hover:underline flex items-center gap-1 font-semibold"
        >
          Go to Delivery Manager 
          <span className="material-symbols-outlined text-[18px] flex items-center justify-center">arrow_forward</span>
        </Link>
      </div>

      {/* Stats Row (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 */}
        <Link to="/schedule" className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-[#F0E6D2] border-l-4 border-l-primary flex items-start gap-4 hover:translate-y-[-2px] transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
          </div>
          <div>
            <div className="font-sans text-body-sm text-on-surface-variant mb-1 font-semibold">Today's Poojas</div>
            <div className="font-display text-headline-md text-on-surface font-bold">3</div>
          </div>
        </Link>

        {/* Card 2 */}
        <Link to="/bookings" className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-[#F0E6D2] border-l-4 border-l-[#f6be39] flex items-start gap-4 hover:translate-y-[-2px] transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-[#f6be39]/20 flex items-center justify-center text-[#795900] flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">person</span>
          </div>
          <div>
            <div className="font-sans text-body-sm text-on-surface-variant mb-1 font-semibold">Pending Pujari Assignments</div>
            <div className="font-display text-headline-md text-on-surface font-bold">2</div>
          </div>
        </Link>

        {/* Card 3 */}
        <Link to="/deliveries" className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-[#F0E6D2] border-l-4 border-l-tertiary flex items-start gap-4 hover:translate-y-[-2px] transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <div className="font-sans text-body-sm text-on-surface-variant mb-1 font-semibold">Pending Deliveries</div>
            <div className="font-display text-headline-md text-on-surface font-bold">5</div>
          </div>
        </Link>

        {/* Card 4 */}
        <Link to="/queries" className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-[#F0E6D2] border-l-4 border-l-[#2E7D32] flex items-start gap-4 hover:translate-y-[-2px] transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">chat</span>
          </div>
          <div>
            <div className="font-sans text-body-sm text-on-surface-variant mb-1 font-semibold">Unread Queries</div>
            <div className="font-display text-headline-md text-on-surface font-bold">1</div>
          </div>
        </Link>

      </div>

      {/* Main Sections (Table + Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming Poojas Table */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl soft-shadow border border-[#F0E6D2] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-white">
            <h2 className="font-display text-headline-sm text-on-surface font-bold">Today's &amp; Tomorrow's Poojas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-sans text-label-md uppercase tracking-wider font-semibold">
                  <th className="p-4 border-b border-outline-variant">Pooja Name</th>
                  <th className="p-4 border-b border-outline-variant">Date &amp; Time</th>
                  <th className="p-4 border-b border-outline-variant text-center">Bookings</th>
                  <th className="p-4 border-b border-outline-variant">Pujari Assigned</th>
                  <th className="p-4 border-b border-outline-variant">Stream Status</th>
                  <th className="p-4 border-b border-outline-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-sans text-body-sm divide-y divide-outline-variant">
                
                {/* Row 1 */}
                <tr className="hover:bg-surface-container-lowest transition-colors bg-white">
                  <td className="p-4 font-semibold text-on-surface">Satyanarayana Pooja</td>
                  <td className="p-4 text-on-surface-variant">Today 10:00 AM</td>
                  <td className="p-4 text-on-surface-variant text-center">12/15</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
                      Not Assigned
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">Not Started</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleAssignPujari('bk-001')}
                        className="font-sans text-button px-4 py-2 rounded-full border-2 border-primary text-primary hover:bg-primary-container/10 transition-colors whitespace-nowrap cursor-pointer font-bold"
                      >
                        Assign Pujari
                      </button>
                      <button 
                        onClick={() => handleStartStream('slot-1')}
                        className="font-sans text-button px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm cursor-pointer font-bold"
                      >
                        Start Stream
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-surface-container-lowest transition-colors bg-white">
                  <td className="p-4 font-semibold text-on-surface">Ganapathi Homam</td>
                  <td className="p-4 text-on-surface-variant">Today 02:00 PM</td>
                  <td className="p-4 text-on-surface-variant text-center">8/10</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20]">
                      Sharma Ji
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">Not Started</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleStartStream('slot-2')}
                      className="font-sans text-button px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm cursor-pointer w-full max-w-[140px] font-bold"
                    >
                      Start Stream
                    </button>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-surface-container-lowest transition-colors bg-white">
                  <td className="p-4 font-semibold text-on-surface">Lakshmi Pooja</td>
                  <td className="p-4 text-on-surface-variant">Tomorrow 09:00 AM</td>
                  <td className="p-4 text-on-surface-variant text-center">5/10</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">
                      Not Assigned
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">Not Started</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleAssignPujari('bk-003')}
                      className="font-sans text-button px-4 py-2 rounded-full border-2 border-primary text-primary hover:bg-primary-container/10 transition-colors whitespace-nowrap cursor-pointer w-full max-w-[140px] font-bold"
                    >
                      Assign Pujari
                    </button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-surface-container-lowest rounded-xl soft-shadow border border-[#F0E6D2] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-white">
            <h2 className="font-display text-headline-sm text-on-surface font-bold">Recent Bookings</h2>
            <Link 
              to="/bookings" 
              className="font-sans text-button text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              View All 
              <span className="material-symbols-outlined text-[16px] flex items-center justify-center">arrow_forward</span>
            </Link>
          </div>
          
          <div className="p-4 flex flex-col gap-4 bg-white">
            
            {/* Booking item 1 */}
            <Link to="/bookings/bk-001" className="flex items-start justify-between p-3 hover:bg-surface-container-low rounded-lg transition-colors border border-transparent hover:border-outline-variant">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-label-md text-on-surface-variant uppercase bg-surface-variant px-2 py-0.5 rounded font-semibold">
                    BK-001
                  </span>
                  <span className="font-sans text-body-md font-bold text-on-surface">Rajesh Kumar</span>
                </div>
                <div className="font-sans text-body-sm text-on-surface-variant">Satyanarayana Pooja • 10 May</div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20]">
                Confirmed
              </span>
            </Link>

            {/* Booking item 2 */}
            <Link to="/bookings/bk-002" className="flex items-start justify-between p-3 hover:bg-surface-container-low rounded-lg transition-colors border border-transparent hover:border-outline-variant">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-label-md text-on-surface-variant uppercase bg-surface-variant px-2 py-0.5 rounded font-semibold">
                    BK-002
                  </span>
                  <span className="font-sans text-body-md font-bold text-on-surface">Priya Sharma</span>
                </div>
                <div className="font-sans text-body-sm text-on-surface-variant">Ganapathi Homam • 10 May</div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20]">
                Confirmed
              </span>
            </Link>

            {/* Booking item 3 */}
            <Link to="/bookings/bk-003" className="flex items-start justify-between p-3 hover:bg-surface-container-low rounded-lg transition-colors border border-transparent hover:border-outline-variant">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-label-md text-on-surface-variant uppercase bg-surface-variant px-2 py-0.5 rounded font-semibold">
                    BK-003
                  </span>
                  <span className="font-sans text-body-md font-bold text-on-surface">Anand Reddy</span>
                </div>
                <div className="font-sans text-body-sm text-on-surface-variant">Lakshmi Pooja • 11 May</div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20]">
                Confirmed
              </span>
            </Link>

            {/* Booking item 4 */}
            <Link to="/bookings/bk-004" className="flex items-start justify-between p-3 hover:bg-surface-container-low rounded-lg transition-colors border border-transparent hover:border-outline-variant">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-label-md text-on-surface-variant uppercase bg-surface-variant px-2 py-0.5 rounded font-semibold">
                    BK-004
                  </span>
                  <span className="font-sans text-body-md font-bold text-on-surface">Sunita Devi</span>
                </div>
                <div className="font-sans text-body-sm text-on-surface-variant">Navagraha Pooja • 12 May</div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20]">
                Confirmed
              </span>
            </Link>

          </div>
        </div>

      </div>

    </div>
  );
}
