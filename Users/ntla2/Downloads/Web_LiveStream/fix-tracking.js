const fs = require('fs');

const path = 'frontend/src/app/tracking/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update the 'statuses' array to match our full possible normal states
content = content.replace(
  "const statuses = ['Đã tiếp nhận', 'Đã xử lý', 'Đang vận chuyển', 'Đã giao'];",
  "const statuses = ['Đã tạo đơn', 'Đang lấy hàng', 'Đang vận chuyển', 'Đang giao', 'Đã giao', 'Giao chưa thành công'];"
);

// 2. Replace Hero Section
const oldHero = `<div className="w-full md:w-3/5 order-2 md:order-1 relative z-10">
              <p className="text-lg text-slate-600 mb-2 font-medium">Xin chào! Chúc mừng bạn đã nhận được quà 🎉</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#005691] leading-tight mb-6">
                Tra cứu <span className="text-[#F58220]">hành trình</span><br />
                Món quà của bạn
              </h1>`;

const newHero = `<div className="w-full md:w-3/5 order-2 md:order-1 relative z-10">
              {!order ? (
                <>
                  <p className="text-lg text-[#F58220] mb-2 font-black uppercase tracking-wider">🎉 Chúc mừng bạn đã chiến thắng!</p>
                  <h1 className="text-3xl md:text-4xl lg:text-4xl font-black text-[#005691] leading-tight mb-4">
                    Cảm ơn bạn đã tham gia thử thách<br/>và đồng hành cùng chúng mình.
                  </h1>
                  <p className="text-lg text-slate-600 mb-6 font-medium">Cùng xem phần quà đang trên đường đến bạn nhé! 🎁</p>
                </>
              ) : (
                <>
                  <p className="text-lg text-[#F58220] mb-2 font-black uppercase tracking-wider">🎁 Quà đang trên đường đến bạn!</p>
                  <h1 className="text-3xl md:text-4xl lg:text-4xl font-black text-[#005691] leading-tight mb-4">
                    Cảm ơn bạn đã đồng hành<br/>cùng chúng mình.
                  </h1>
                  <p className="text-lg text-slate-600 mb-6 font-medium">Hẹn gặp lại bạn trong những hoạt động tiếp theo!</p>
                </>
              )}`;

content = content.replace(oldHero, newHero);

// 3. Replace the Timeline map
const oldTimeline = `{[
                      { status: 'Đã tiếp nhận', desc: 'Đã ghi nhận thông tin nhận quà từ hệ thống FPTU.', icon: Box },
                      { status: 'Đã xử lý', desc: 'Quà đã được đóng gói và sẵn sàng giao cho ĐVVC.', icon: Package },
                      { status: 'Đang vận chuyển', desc: 'Đơn vị vận chuyển đang đi giao.', icon: Truck },
                      { status: 'Đã giao', desc: 'Giao hàng thành công.', icon: Heart }
                    ].map((step, idx) => {`;

const newTimeline = `(() => {
                      const baseSteps = [
                        { status: 'Đã tạo đơn', desc: 'Quà đã được tụi mình đóng gói xong! Một chút yêu thương đang chuẩn bị lên đường đến bạn 💗', icon: Box },
                        { status: 'Đang lấy hàng', desc: 'Quà đang được shipper đến lấy!', icon: Package },
                        { status: 'Đang vận chuyển', desc: 'Quà đang trên đường đến bạn! Kiên nhẫn xíu nha, cuộc gặp này sắp tới rồi 💨', icon: Truck },
                        { status: 'Đang giao', desc: 'TING TING! 🔔 Hình như quà đang ở rất gần bạn rồi đó!', icon: Clock },
                      ];
                      
                      const steps = order.status === 'Giao chưa thành công' 
                        ? [...baseSteps, { status: 'Giao chưa thành công', desc: 'Quà chưa đến được bạn ! Bạn kiểm tra lại thông tin nhận hàng và chờ shipper liên hệ nha', icon: X }]
                        : [...baseSteps, { status: 'Đã giao', desc: 'YAY! Bạn nhận được quà rồi! 🎉 Cảm ơn bạn đã cùng tụi mình tạo nên một buổi LIVE thật vui. Hẹn gặp lại bạn ở những thử thách tiếp theo nha!', icon: CheckCircle2 }];
                      
                      const currentStepIndex = steps.findIndex(s => s.status === order.status);
                      const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

                      return steps.map((step, idx) => {
                        const isCompleted = activeIndex >= idx;
                        const isCurrent = activeIndex === idx;
                        const Icon = step.icon;
                        
                        return (
                          <div key={idx} className="relative z-10 flex gap-6">
                            <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm mt-0.5 transition-colors \${isCompleted ? (step.status === 'Giao chưa thành công' ? 'bg-red-500 text-white' : 'bg-[#F58220] text-white') : 'bg-slate-200 text-slate-400'}\`}>
                              {isCompleted ? (step.status === 'Giao chưa thành công' ? <X size={16} /> : <CheckCircle2 size={16} />) : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                            </div>
                            <div className={\`flex-1 \${isCompleted ? 'opacity-100' : 'opacity-50'}\`}>
                              <h5 className={\`font-bold text-lg \${isCurrent ? (step.status === 'Giao chưa thành công' ? 'text-red-600' : 'text-[#005691]') : 'text-slate-700'}\`}>{step.status}</h5>
                              <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">{step.desc}</p>
                              
                              {isCurrent && step.status === 'Đang vận chuyển' && order.trackingLink && (
                                <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-[#005691] text-white rounded text-sm font-semibold hover:bg-[#004270] transition-colors">
                                  Xem trên trang {order.shippingProvider} <ArrowRight size={14}/>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()`;

// We need to match exactly how the old code mapped. The old code was:
// {[...].map((step, idx) => { ... })}
// We will just replace the entire block inside <div className="space-y-8">...</div>

// Let's use regex to grab the block.
content = content.replace(
  /\{\[\s*\{\s*status:\s*'Đã tiếp nhận'[\s\S]*?\}\)\;\s*\}\)\}/m,
  newTimeline
);

fs.writeFileSync(path, content);
console.log('Done Tracking Replacement!');
