import tkinter as tk
from tkinter import messagebox, scrolledtext, filedialog, colorchooser
import json
import re
import urllib.request
import urllib.parse
import random
import calendar
from datetime import datetime


class TravelBardApp:
    def __init__(self, root):
        self.root = root
        self.root.title("风之旅人 - 游记管理罗盘")
        self.root.geometry("880x680")

        self.locations = []
        self.current_edit_id = None

        # --- 左侧：记忆列表 ---
        list_frame = tk.Frame(root)
        list_frame.pack(side=tk.LEFT, fill=tk.BOTH, padx=10, pady=10)

        tk.Label(list_frame, text="旅途记忆列表 (按日期排序)").pack()
        self.listbox = tk.Listbox(list_frame, width=35, height=25)
        self.listbox.pack(fill=tk.BOTH, expand=True)
        self.listbox.bind('<<ListboxSelect>>', self.on_select)

        # --- 右侧：记忆编辑区 ---
        edit_frame = tk.Frame(root)
        edit_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.entries = {}
        # 字段定义，visitDate 改为 firstVisitDate
        fields = [
            ("ID (id)", "id"),
            ("地名 (name)", "name"),
            ("纬度 (latitude)", "latitude"),
            ("经度 (longitude)", "longitude"),
            ("第一次游览日期", "firstVisitDate"),
            ("标记颜色 (markerColor)", "markerColor")
        ]

        for label_text, field_name in fields:
            row_frame = tk.Frame(edit_frame)
            row_frame.pack(fill=tk.X, pady=2)
            tk.Label(row_frame, text=label_text, width=20, anchor='w').pack(side=tk.LEFT)
            entry = tk.Entry(row_frame)
            entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
            self.entries[field_name] = entry

            # 功能按钮配置
            if field_name == "id":
                entry.config(bg="#f0f0f0")
                tk.Label(row_frame, text="🔢 自动顺号", fg="gray").pack(side=tk.LEFT, padx=5)
            elif field_name == "name":
                tk.Button(row_frame, text="🌍 寻星定位", command=self.fetch_coordinates, bg="#E0FFFF").pack(side=tk.LEFT,
                                                                                                           padx=5)
            elif field_name == "firstVisitDate":
                # 【新功能】：日期点选按钮
                tk.Button(row_frame, text="📅 日期点选", command=self.open_calendar, bg="#F0FFF0").pack(side=tk.LEFT,
                                                                                                       padx=5)
            elif field_name == "markerColor":
                tk.Button(row_frame, text="🎲 随机独色", command=self.set_random_unique_color, bg="#F0E68C").pack(
                    side=tk.LEFT, padx=2)
                tk.Button(row_frame, text="🎨 调色盘", command=self.choose_color, bg="#FFB6C1").pack(side=tk.LEFT,
                                                                                                    padx=2)

        tk.Label(edit_frame, text="游记内容 (content - Markdown格式):", anchor='w').pack(fill=tk.X, pady=(10, 0))
        self.text_content = scrolledtext.ScrolledText(edit_frame, height=12)
        self.text_content.pack(fill=tk.BOTH, expand=True, pady=5)

        # --- 底部：按钮区 ---
        btn_frame = tk.Frame(edit_frame)
        btn_frame.pack(fill=tk.X, pady=5)

        tk.Button(btn_frame, text="✨ 谱写新记忆 (Add)", command=self.add_location).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="🍃 修改旧日篇章 (Update)", command=self.update_location).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="🌪️ 随风散去 (Delete)", command=self.delete_location).pack(side=tk.LEFT, padx=2)
        tk.Button(btn_frame, text="🧹 清空画板 (Clear)", command=self.clear_form).pack(side=tk.LEFT, padx=2)

        io_frame = tk.Frame(edit_frame)
        io_frame.pack(fill=tk.X, pady=5)
        tk.Button(io_frame, text="📜 吟唱为 TypeScript (Export)", bg="#87CEFA", command=self.export_ts).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=2)
        tk.Button(io_frame, text="📖 研读旧日乐谱 (Import TS)", bg="#FFFACD", command=self.import_ts).pack(side=tk.LEFT,
                                                                                                          fill=tk.X,
                                                                                                          expand=True,
                                                                                                          padx=2)

        self.clear_form()

    # --- 新增魔法：日期选择器窗口 ---
    def open_calendar(self):
        cal_win = tk.Toplevel(self.root)
        cal_win.title("选择日期")
        cal_win.geometry("280x300")
        cal_win.grab_set()  # 模态窗口

        now = datetime.now()
        self.cal_year = now.year
        self.cal_month = now.month

        # UI 容器
        header = tk.Frame(cal_win)
        header.pack(pady=5)

        lbl_month = tk.Label(header, text="", width=15, font=("Arial", 10, "bold"))

        def update_cal():
            lbl_month.config(text=f"{self.cal_year}年 {self.cal_month}月")
            for widget in body.winfo_children():
                widget.destroy()

            # 星期表头
            days = ["日", "一", "二", "三", "四", "五", "六"]
            for i, d in enumerate(days):
                tk.Label(body, text=d, fg="gray").grid(row=0, column=i)

            # 获取月份详情
            month_days = calendar.monthcalendar(self.cal_year, self.cal_month)
            for r, week in enumerate(month_days):
                for c, day in enumerate(week):
                    if day != 0:
                        btn = tk.Button(body, text=str(day), width=3,
                                        command=lambda d=day: select_date(d))
                        btn.grid(row=r + 1, column=c, padx=2, pady=2)

        def select_date(day):
            date_str = f"{self.cal_year}-{self.cal_month:02d}-{day:02d}"
            self.entries["firstVisitDate"].delete(0, tk.END)
            self.entries["firstVisitDate"].insert(0, date_str)
            cal_win.destroy()

        def prev_m():
            self.cal_month -= 1
            if self.cal_month < 1:
                self.cal_month = 12
                self.cal_year -= 1
            update_cal()

        def next_m():
            self.cal_month += 1
            if self.cal_month > 12:
                self.cal_month = 1
                self.cal_year += 1
            update_cal()

        tk.Button(header, text="<", command=prev_m).pack(side=tk.LEFT)
        lbl_month.pack(side=tk.LEFT)
        tk.Button(header, text=">", command=next_m).pack(side=tk.LEFT)

        body = tk.Frame(cal_win)
        body.pack(pady=10)
        update_cal()

    def set_random_unique_color(self):
        existing_colors = {loc.get('markerColor', '').lower() for loc in self.locations}
        while True:
            color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
            if color not in existing_colors:
                self.entries["markerColor"].delete(0, tk.END)
                self.entries["markerColor"].insert(0, color)
                break

    def organize_locations(self):
        # 按 firstVisitDate 排序
        self.locations.sort(key=lambda x: (str(x.get('firstVisitDate', '')), str(x.get('name', ''))))
        for index, loc in enumerate(self.locations):
            loc['id'] = str(index + 1)
        self.refresh_list()

    def choose_color(self):
        current = self.entries["markerColor"].get().strip() or "#ff0000"
        color_code = colorchooser.askcolor(title="选择标记颜色", initialcolor=current)
        if color_code and color_code[1]:
            self.entries["markerColor"].delete(0, tk.END)
            self.entries["markerColor"].insert(0, color_code[1])

    def fetch_coordinates(self):
        name = self.entries["name"].get().strip()
        if not name: return
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(name)}&format=json&limit=1"
            req = urllib.request.Request(url, headers={'User-Agent': 'TravelBardApp/1.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                if data:
                    self.entries["latitude"].delete(0, tk.END)
                    self.entries["latitude"].insert(0, str(round(float(data[0]['lat']), 6)))
                    self.entries["longitude"].delete(0, tk.END)
                    self.entries["longitude"].insert(0, str(round(float(data[0]['lon']), 6)))
        except Exception as e:
            messagebox.showerror("错误", f"获取坐标失败: {e}")

    def import_ts(self):
        filepath = filedialog.askopenfilename(filetypes=[("TypeScript", "*.ts")])
        if not filepath: return
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                ts_content = f.read()
            # 兼容旧版的 visitDate 和新版的 firstVisitDate
            pattern = r"{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*latitude:\s*([-\d.]+),\s*longitude:\s*([-\d.]+),\s*(?:visitDate|firstVisitDate):\s*'([^']+)',\s*markerColor:\s*'([^']+)',.*?content:\s*`([\s\S]*?)`\s*,?\s*}"
            matches = re.finditer(pattern, ts_content, re.DOTALL)
            imported_count = 0
            for match in matches:
                data = {
                    "id": match.group(1),
                    "name": match.group(2),
                    "latitude": float(match.group(3)),
                    "longitude": float(match.group(4)),
                    "firstVisitDate": match.group(5),  # 统一转为新字段
                    "markerColor": match.group(6),
                    "images": [],
                    "content": match.group(7).replace('\\`', '`')
                }
                self.locations = [loc for loc in self.locations if
                                  not (loc['name'] == data['name'] and loc['firstVisitDate'] == data['firstVisitDate'])]
                self.locations.append(data)
                imported_count += 1

            self.organize_locations()
            self.clear_form()
            messagebox.showinfo("成功", f"成功唤醒 {imported_count} 段记忆！")
        except Exception as e:
            messagebox.showerror("失败", f"导入错误: {e}")

    def get_form_data(self):
        try:
            color = self.entries["markerColor"].get().strip()
            if not color:
                existing_colors = {loc.get('markerColor', '').lower() for loc in self.locations}
                while True:
                    color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
                    if color not in existing_colors: break

            return {
                "id": self.entries["id"].get().strip(),
                "name": self.entries["name"].get().strip(),
                "latitude": float(self.entries["latitude"].get() or 0.0),
                "longitude": float(self.entries["longitude"].get() or 0.0),
                "firstVisitDate": self.entries["firstVisitDate"].get().strip(),
                "markerColor": color,
                "images": [],
                "content": self.text_content.get("1.0", tk.END).strip()
            }
        except ValueError:
            messagebox.showerror("提示", "经纬度格式不正确。")
            return None

    def refresh_list(self):
        self.listbox.delete(0, tk.END)
        for loc in self.locations:
            self.listbox.insert(tk.END, f"[{loc['id']}] {loc['firstVisitDate']} - {loc['name']}")

    def on_select(self, event):
        selection = self.listbox.curselection()
        if not selection: return
        loc = self.locations[selection[0]]
        self.current_edit_id = loc['id']
        self.clear_form_entries()
        for field in ["id", "name", "firstVisitDate", "markerColor"]:
            self.entries[field].insert(0, loc.get(field, ""))
        self.entries["latitude"].insert(0, str(loc.get("latitude", "")))
        self.entries["longitude"].insert(0, str(loc.get("longitude", "")))
        self.text_content.insert(tk.END, loc.get("content", ""))

    def add_location(self):
        data = self.get_form_data()
        if not data or not data['name']: return
        self.locations.append(data)
        self.organize_locations()
        self.clear_form()

    def update_location(self):
        if self.current_edit_id is None: return
        data = self.get_form_data()
        if data:
            for i, loc in enumerate(self.locations):
                if loc['id'] == self.current_edit_id:
                    self.locations[i] = data
                    break
            self.organize_locations()
            messagebox.showinfo("成功", "篇章已重排。")

    def delete_location(self):
        if self.current_edit_id is None: return
        if messagebox.askyesno("确认", "确定让这段记忆随风消散吗？"):
            self.locations = [loc for loc in self.locations if loc['id'] != self.current_edit_id]
            self.organize_locations()
            self.clear_form()

    def clear_form_entries(self):
        for entry in self.entries.values():
            entry.delete(0, tk.END)
        self.text_content.delete("1.0", tk.END)

    def clear_form(self):
        self.current_edit_id = None
        self.listbox.selection_clear(0, tk.END)
        self.clear_form_entries()
        self.entries["id"].insert(0, str(len(self.locations) + 1))
        self.set_random_unique_color()

    def export_ts(self):
        if not self.locations: return
        self.organize_locations()
        ts_code = "import { TravelLocation } from '../models/location.model';\n\n"
        ts_code += "export const DEFAULT_LOCATIONS: TravelLocation[] = [\n"
        for loc in self.locations:
            content_safe = loc['content'].replace('`', '\\`')
            ts_code += f"  {{\n    id: '{loc['id']}',\n    name: '{loc['name']}',\n    latitude: {loc['latitude']},\n    longitude: {loc['longitude']},\n    firstVisitDate: '{loc['firstVisitDate']}',\n    markerColor: '{loc['markerColor']}',\n    images: [],\n    content: `{content_safe}`,\n  }},\n"
        ts_code += "];\n"

        export_win = tk.Toplevel(self.root)
        export_win.title("生成的 TypeScript 代码")
        export_win.geometry("600x500")
        txt = scrolledtext.ScrolledText(export_win)
        txt.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        txt.insert(tk.END, ts_code)


if __name__ == "__main__":
    root = tk.Tk()
    app = TravelBardApp(root)
    root.mainloop()