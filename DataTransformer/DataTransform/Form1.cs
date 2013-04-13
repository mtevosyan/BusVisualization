using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;

namespace DataTransform
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button_Process_Click(object sender, EventArgs e)
        {
            DirectoryInfo data_source =null;
            String data_name = null;
            using (FolderBrowserDialog fbd = new FolderBrowserDialog())
            {
                fbd.SelectedPath = Path.Combine(Application.StartupPath, "Data");
                if (fbd.ShowDialog() != System.Windows.Forms.DialogResult.OK)
                { return; }
                data_source = new DirectoryInfo(fbd.SelectedPath);
            }
            data_name = textBox_name.Text;
            process_file(data_source, data_name);
        }

        private DirectoryInfo _output_root;
        private DirectoryInfo output_root
        {
            get
            {
                if (_output_root == null)
                {
                    _output_root = new DirectoryInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "BusVisualization", "FormattedData"));
                }
                return _output_root;
            }
        }

        private async void process_file(DirectoryInfo input, String Name)
        {
            await Task.Yield();
            DirectoryInfo output = new DirectoryInfo(Path.Combine(output_root.FullName, Name));
            if (!output.Exists)
            { output.Create(); }
            try { richTextBox_Output.Text = "Starting: \r\n"+input.FullName+"\r\n to\r\n"+output.FullName; }
            catch { }
            ClearFolder(output);
            FileInfo routeInfo = makeFile(output, "routes.json");
            FileInfo schedules = makeFile(output, "schedules.json");
            List<ScheduleInfo> schedule_results = new List<ScheduleInfo>();
            schedule_results.Add( await process_schedule(input, output, "Weekday"));
            schedule_results.Add(await process_schedule(input, output, "Weekend"));
            using (StreamWriter sw = new StreamWriter(routeInfo.FullName))
            { await sw.WriteAsync("[{r:1,name:'Our First Bus Route'}]"); }
            using (StreamWriter sw = new StreamWriter(schedules.FullName))
            {
                await sw.WriteAsync("[");
                String sched_delim = "";
                foreach (ScheduleInfo info in schedule_results)
                {
                    await sw.WriteAsync(sched_delim);
                    sched_delim = ",";
                    await sw.WriteAsync("{name:'" + info.name + "', index:'" + info.indexfile.Name + "', data:'" + info.datafile.Name + "'}");
                }
                await sw.WriteAsync("]");
            }
            try { richTextBox_Output.Text = "Done"; }
            catch { }
        }

        private async Task< ScheduleInfo> process_schedule(DirectoryInfo input, DirectoryInfo output, String scheduleId)
        {
            Random rnd = new Random();
            ScheduleInfo temp = new ScheduleInfo
            {
                name = scheduleId,
                datafile = makeFile(output, scheduleId+"-schedule.json"),
                indexfile = makeFile(output, scheduleId+"-index.json")
            };
            using (StreamWriter sw_index = new StreamWriter(temp.indexfile.FullName))
            using (StreamWriter sw_data = new StreamWriter(temp.datafile.FullName))
            {                
                String indexDelim = "";
                String dataDelim = "";
                await sw_index.WriteAsync("[");
                await sw_data.WriteAsync("[");
                for (int i = 0; i < 1440; i++)
                {
                    await sw_index.WriteAsync(indexDelim);
                    indexDelim = ",";
                    await sw_data.FlushAsync();
                    await sw_index.WriteAsync(sw_data.BaseStream.Position.ToString());
                    await sw_data.WriteAsync(dataDelim);
                    dataDelim = ",\r\n";
                    await sw_data.WriteAsync("[");
                    String bus_delim = "";
                    for (int r = 1; r < 100; r++)
                    {
                        for (int b = 1; b < 10; b++)
                        {
                            await sw_data.WriteAsync(bus_delim);
                            bus_delim = ",";
                            await sw_data.WriteAsync("{x:" + (int)(rnd.Next(-5000, 5000)) + ",y:" + (int)(rnd.Next(-5000, 5000)) + "r:" + r + ",b:" + b + "}");
                        }
                    }
                    await sw_data.WriteAsync("]");
                }
                await sw_index.WriteAsync("]");
                await sw_data.WriteAsync("]");
                await sw_index.FlushAsync();
                await sw_data.FlushAsync();
            }
            return temp;
        }

        private class ScheduleInfo
        {
            public String name;
            public FileInfo datafile;
            public FileInfo indexfile;
        }

        private FileInfo makeFile(DirectoryInfo folder, String name)
        {
            return new FileInfo(Path.Combine(folder.FullName, name));
        }

        private void ClearFolder(DirectoryInfo folder)
        {
            foreach (FileInfo file in folder.GetFiles())
            {
                file.Delete();
            }
        }
    }
}
