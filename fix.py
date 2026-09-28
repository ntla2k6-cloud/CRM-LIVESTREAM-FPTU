import sys

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

idx1 = code.find('    let totalMin = 0;')
idx2 = code.find('  const statsHtml = ', idx1)

if idx1 > -1 and idx2 > -1:
    replace_str = '''    let totalMin = 0;
    att.forEach(a => {
      if (a.checkIn && a.checkOut) {
        const toMin = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
        totalMin += Math.max(0, toMin(a.checkOut) - toMin(a.checkIn));
      }
    });

    const baseSalary = Number(s.salary || s.baseSalary || 0);
    const hourlyRate = Number(s.hourlyRate || s.wagePerHour || 0);
    const sessionRate = Number(s.sessionRate || s.wagePerSession || 0);

    let pay = baseSalary;
    if (hourlyRate > 0) pay += Math.round(totalMin / 60 * hourlyRate);
    if (sessionRate > 0) pay += workDays * sessionRate;

    const lateDeduct = lateMin * 1000;
    const finalPay = Math.max(0, pay - lateDeduct);

    return { s, workDays, teachingSessions:0, totalMin, lateMin, lateDeduct, baseSalary, pay, finalPay };
  });

  if (!rows.length) {
    content.innerHTML = \<div class="card"><div style="text-align:center;padding:30px;color:var(--muted)">Chua có d? li?u nhân s?. Vào <b>GV & Nhân Viên</b> d? thêm nhân s? tru?c.</div></div>\;
    return;
  }

  const totalPayroll = rows.reduce((a,r) => a + r.finalPay, 0);

'''
    new_code = code[:idx1] + replace_str + code[idx2:]
    
    # We also need to add the Rate luong/1 ca column
    idx_tr = new_code.find('<th style=\"text-align:right\">Rate luong/1h</th>')
    if idx_tr > -1:
        new_code = new_code.replace(
            '<th style=\"text-align:right\">Rate luong/1h</th>\\n              <th style=\"text-align:center\">S? gi? làm</th>',
            '<th style=\"text-align:right\">Rate/1h</th>\\n              <th style=\"text-align:center\">S? gi?</th>\\n              <th style=\"text-align:right\">Rate/1ca</th>\\n              <th style=\"text-align:center\">S? ca</th>'
        )
        new_code = new_code.replace(
            '<td style=\"text-align:right\"></td>\\n      <td style=\"text-align:center\">h</td>',
            '<td style=\"text-align:right\"></td>\\n      <td style=\"text-align:center\">h</td>\\n      <td style=\"text-align:right\"></td>\\n      <td style=\"text-align:center\"></td>'
        )
        new_code = new_code.replace('colspan=\"8\"', 'colspan=\"10\"')
    
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print('Fixed via Python script file')
else:
    print('Indices not found', idx1, idx2)
