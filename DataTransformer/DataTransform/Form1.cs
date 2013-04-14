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
using CsvHelper;

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
            DirectoryInfo data_source = null;
            String data_name = null;
            using (FolderBrowserDialog fbd = new FolderBrowserDialog())
            {
                fbd.SelectedPath = Path.Combine(Application.StartupPath, "Data");
                if (fbd.ShowDialog() != System.Windows.Forms.DialogResult.OK)
                { return; }
                data_source = new DirectoryInfo(fbd.SelectedPath);
            }
            data_name = textBox_name.Text;
            process_folder(data_source, data_name);
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

        private async void process_folder(DirectoryInfo input, String Name)
        {
            await Task.Yield();
            DirectoryInfo output = new DirectoryInfo(Path.Combine(output_root.FullName, Name));
            if (!output.Exists)
            { output.Create(); }
            try { richTextBox_Output.Text = "Starting: \r\n" + input.FullName + "\r\n to\r\n" + output.FullName; }
            catch { }
            ClearFolder(output);
            Dictionary<String, BusStop> all_stops = await ParseStops(input);
            BusStop average_location = AverageLocation(all_stops.Values);
            ConvertAllGPS(all_stops.Values, average_location);
            AggregatedRouteInfo routes = await parse_routes(input, output);

            List<ScheduleInfo> schedule_results = await parse_schedules(input);
            try { richTextBox_Output.Text = "Reading stop times"; }
            catch { }
            List<stopTimeInfo> all_stop_times = await LoadStopTimes(input);
            try { richTextBox_Output.Text = "Sorting Data"; }
            catch { }
            all_stop_times.Sort();
            try { richTextBox_Output.Text = "Processing Schedules"; }
            catch { }
            foreach (ScheduleInfo sched in schedule_results)
            {
                await process_schedule(all_stop_times, output, sched, routes, all_stops);
                break;
            }
            FileInfo scheduleOutputFile = makeFile(output, "schedules.json");
            using (StreamWriter sw = new StreamWriter(scheduleOutputFile.FullName))
            {
                await sw.WriteAsync("[");
                String sched_delim = "";
                foreach (ScheduleInfo info in schedule_results)
                {
                    if (info.datafile == null) { continue; }
                    await sw.WriteAsync(sched_delim);
                    sched_delim = ",\r\n";
                    await sw.WriteAsync("{\"name\":\"" + info.Name + "\", \"index\":\"" + info.indexfile.Name + "\", \"data\":\"" + info.datafile.Name + "\",\"gps_lat\":" + average_location.gps_lat + ",\"gps_long\":" + average_location.gps_lon + "}");
                }
                await sw.WriteAsync("]");
            }
            try { richTextBox_Output.Text = "Done"; }
            catch { }
        }

        private async Task<List<ScheduleInfo>> parse_schedules(DirectoryInfo input)
        {
            await Task.Yield();
            FileInfo scheduleInputFile = makeFile(input, "calendar.txt");
            List<ScheduleInfo> result = new List<ScheduleInfo>();
            using (StreamReader sr = new StreamReader(scheduleInputFile.FullName))
            using (CsvReader csvr = new CsvReader(sr))
            {
                while (csvr.Read())
                {
                    ScheduleInfo info = new ScheduleInfo()
                    {
                        Name = csvr.GetField("service_id"),
                        Monday = csvr.GetField<int>("monday") != 0,
                        Tuesday = csvr.GetField<int>("tuesday") != 0,
                        Wednesday = csvr.GetField<int>("wednesday") != 0,
                        Thursday = csvr.GetField<int>("thursday") != 0,
                        Friday = csvr.GetField<int>("friday") != 0,
                        Saturday = csvr.GetField<int>("saturday") != 0,
                        Sunday = csvr.GetField<int>("sunday") != 0
                    };
                    result.Add(info);
                }
            }
            return result;
        }

        private class ScheduleInfo
        {
            public String Name;
            public FileInfo datafile;
            public FileInfo indexfile;
            public bool Monday;
            public bool Tuesday;
            public bool Wednesday;
            public bool Thursday;
            public bool Friday;
            public bool Saturday;
            public bool Sunday;
        }

        private class AggregatedRouteInfo
        {
            public Dictionary<String, BusRoute> routeIdLookup;
            public Dictionary<String, BusRoute> tripIdLookup;
        }

        private async Task<AggregatedRouteInfo> parse_routes(DirectoryInfo input, DirectoryInfo output)
        {
            await Task.Yield();
            FileInfo routes = makeFile(input, "routes.txt");
            Dictionary<String, BusRoute> tripLookup = new Dictionary<string, BusRoute>();
            Dictionary<String, BusRoute> routeLookup = new Dictionary<string, BusRoute>();
            int count = 1;
            using (StreamReader sr = new StreamReader(routes.FullName))
            using (CsvReader csvr = new CsvReader(sr, CsvConfig))
            {
                while (csvr.Read())
                { routeLookup.Add(csvr.GetField("route_id"), new BusRoute() { id = count++, shortName = csvr.GetField("route_short_name") }); }
            }
            FileInfo trips = makeFile(input, "trips.txt");
            using (StreamReader sr = new StreamReader(trips.FullName))
            using (CsvReader csvr = new CsvReader(sr, CsvConfig))
            {
                while (csvr.Read())
                {
                    BusRoute route;
                    if (routeLookup.TryGetValue(csvr.GetField("route_id"), out route))
                    {
                        route.longName = csvr.GetField("trip_headsign");
                        route.schedule = csvr.GetField("service_id");
                        tripLookup.Add(csvr.GetField("trip_id"), route);
                    }
                }
            }
            FileInfo routesOutput = makeFile(output, "routes.json");
            using (StreamWriter sw = new StreamWriter(routesOutput.FullName))
            {
                String routesdelim = "";
                await sw.WriteAsync("[");
                foreach (BusRoute route in routeLookup.Values)
                {
                    await sw.WriteAsync(routesdelim);
                    routesdelim = ",\r\n";
                    await sw.WriteAsync("{\"r\":" + route.id + ",\"name\":\"" + route.shortName.Replace("\"", "") + " " + route.longName.Replace("\"", "") + "\"}");
                }
                await sw.WriteAsync("]");
            }
            return new AggregatedRouteInfo() { routeIdLookup = routeLookup, tripIdLookup = tripLookup };
        }

        private class BusRoute
        {
            public int id;
            public String shortName;
            public String longName;
            public String schedule;
        }

        private CsvHelper.Configuration.CsvConfiguration __csvConfig;
        public CsvHelper.Configuration.CsvConfiguration CsvConfig
        {
            get
            {
                if (__csvConfig == null)
                {
                    __csvConfig = new CsvHelper.Configuration.CsvConfiguration()
                    {
                        IsCaseSensitive = false,
                        IsStrictMode = true,
                        SkipEmptyRecords = true
                    };
                }
                return __csvConfig;
            }
        }

        public BusStop AverageLocation(IEnumerable<BusStop> stops)
        {
            double lat_sum = 0;
            double lon_sum = 0;
            double count = 0;
            foreach (BusStop stop in stops)
            {
                lat_sum += stop.gps_lat;
                lon_sum += stop.gps_lon;
                count++;
            }
            return new BusStop()
            {
                gps_lat = lat_sum / count,
                gps_lon = lon_sum / count
            };
        }

        public async Task<Dictionary<String, BusStop>> ParseStops(DirectoryInfo input)
        {
            await Task.Yield();
            Dictionary<String, BusStop> result = new Dictionary<string, BusStop>();
            FileInfo stopfile = makeFile(input, "stops.txt");
            using (StreamReader sr = new StreamReader(stopfile.FullName))
            using (CsvReader csvr = new CsvReader(sr, CsvConfig))
            {
                while (csvr.Read())
                {
                    result.Add(csvr.GetField("stop_id"), new BusStop() { gps_lat = csvr.GetField<double>("stop_lat"), gps_lon = csvr.GetField<double>("stop_lon") });
                }
            }
            return result;
        }

        private void ConvertAllGPS(IEnumerable<BusStop> stops, BusStop zeroPoint)
        {
            foreach (BusStop stop in stops)
            { ConvertGPS(stop, zeroPoint); }
        }

        private void ConvertGPS(BusStop stop, BusStop zeroPoint)
        {
            double x = distance_in_km(zeroPoint.gps_lat, zeroPoint.gps_lat, zeroPoint.gps_lon, stop.gps_lon);
            double y = distance_in_km(zeroPoint.gps_lat, stop.gps_lat, zeroPoint.gps_lat, zeroPoint.gps_lat);

            if (stop.gps_lon < zeroPoint.gps_lon)
            { x = -x; }

            if (stop.gps_lat > zeroPoint.gps_lat)
            { y = -y; }

            stop.x = (int)(x * 1000);
            stop.y = (int)(y * 1000);
        }

        private double distance_in_km(double lat1, double lat2, double long1, double long2)
        {
            double d2r = Math.PI / 180.0;

            //calculate haversine distance for linear distance
            double dlong = (long2 - long1) * d2r;
            double dlat = (lat2 - lat1) * d2r;
            double a = Math.Pow(Math.Sin(dlat / 2.0), 2) + Math.Cos(lat1 * d2r) * Math.Cos(lat2 * d2r) * Math.Pow(Math.Sin(dlong / 2.0), 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            double dist_in_km = 6367 * c;
            return dist_in_km;
        }


        public class BusStop
        {
            public int x;
            public int y;
            public double gps_lat;
            public double gps_lon;
        }

        private int parseTime(String time)
        {
            DateTime t;
            if (!DateTime.TryParse(time, out t))
            {
                return -1;
            }
            return (int)t.Subtract(t.Date).TotalMinutes % 1440;
        }

        private class TripDataPoint
        {
            public int routeId;
            public int tripId;
            public int time;
            public int next;
            public int x;
            public int y;
        }

        private class stopTimeInfo : IComparable<stopTimeInfo>
        {
            public String trid_id;
            public String stop_id;
            public String arrival_time;

            public int CompareTo(stopTimeInfo other)
            {
                if (other == null)
                { return 1; }
                if (arrival_time == null)
                { return other.arrival_time == null ? 0 : -1; }
                return arrival_time.CompareTo(other.arrival_time);
            }
        }

        private async Task<List<stopTimeInfo>> LoadStopTimes(DirectoryInfo input)
        {
            await Task.Yield();
            List<stopTimeInfo> result = new List<stopTimeInfo>();
            FileInfo stopTimesFiles = makeFile(input, "stop_times.txt");
            using (StreamReader sr = new StreamReader(stopTimesFiles.FullName))
            using (CsvReader csvr = new CsvReader(sr, CsvConfig))
            {
                while (csvr.Read())
                {
                    result.Add(new stopTimeInfo()
                    {
                        trid_id = csvr.GetField("trip_id"),
                        stop_id = csvr.GetField("stop_id"),
                        arrival_time = csvr.GetField("arrival_time")
                    });
                }
            }
            return result;
        }

        private async Task process_schedule(List<stopTimeInfo> all_stop_times, DirectoryInfo output, ScheduleInfo theSchedule, AggregatedRouteInfo routes, Dictionary<String, BusStop> stops)
        {
            Random rnd = new Random();
            theSchedule.datafile = makeFile(output, theSchedule.Name + "-schedule.json");
            theSchedule.indexfile = makeFile(output, theSchedule.Name + "-index.json");
            Dictionary<int, List<TripDataPoint>> parsedStops = new Dictionary<int, List<TripDataPoint>>();
            Dictionary<int, int> lastTime = new Dictionary<int, int>();
            Dictionary<String, int> trips = new Dictionary<string, int>();
            int maxTime = 0;

            foreach (stopTimeInfo stopTime in all_stop_times)
            {
                String externalTripId = stopTime.trid_id;
                int internalTripId;
                if (!trips.TryGetValue(externalTripId, out internalTripId))
                {
                    internalTripId = trips.Count + 1;
                    trips.Add(externalTripId, internalTripId);
                }
                BusRoute route = routes.tripIdLookup[externalTripId];
                if (route.schedule == theSchedule.Name)
                {
                    BusStop stop;
                    if (!stops.TryGetValue(stopTime.stop_id, out stop))
                    {
                        continue;
                    }
                    int current = parseTime(stopTime.arrival_time);
                    int last;
                    if (!lastTime.TryGetValue(internalTripId, out last))
                    { last = current; }
                    else if (current - last == 0)
                    { continue; }
                    lastTime[internalTripId] = current;

                    List<TripDataPoint> timeSlot;
                    if (!parsedStops.TryGetValue(last, out timeSlot))
                    {
                        timeSlot = new List<TripDataPoint>();
                        parsedStops.Add(last, timeSlot);
                    }
                    timeSlot.Add(new TripDataPoint()
                    {
                        routeId = route.id,
                        tripId = internalTripId,
                        time = last,
                        next = current - last,
                        x = stop.x,
                        y = stop.y
                    });
                    if (last > maxTime)
                    { maxTime = last; }
                }
            }

            parsedStops = ProjectPointsBackwardsInTime(parsedStops);

            using (StreamWriter sw_index = new StreamWriter(theSchedule.indexfile.FullName))
            using (StreamWriter sw_data = new StreamWriter(theSchedule.datafile.FullName))
            {
                String indexDelim = "";
                String dataDelim = "";
                await sw_index.WriteAsync("[");
                await sw_data.WriteAsync("[");
                for (int i = 0; i < maxTime; i++)
                {
                    await sw_index.WriteAsync(indexDelim);
                    indexDelim = ",";
                    await sw_data.WriteAsync(dataDelim);
                    dataDelim = ",\r\n";
                    await sw_data.FlushAsync();
                    await sw_index.WriteAsync(sw_data.BaseStream.Position.ToString());
                    await sw_data.WriteAsync("[");
                    String bus_delim = "";

                    List<TripDataPoint> timeslot;
                    if (parsedStops.TryGetValue(i, out timeslot))
                    {
                        foreach (TripDataPoint data in timeslot)
                        {
                            await sw_data.WriteAsync(bus_delim);
                            bus_delim = ",";
                            await sw_data.WriteAsync("{\"r\":" + data.routeId + ",\"b\":" + data.tripId + ",\"x\":" + data.x + ",\"y\":" + data.y + ",\"n\":" + data.next + "}");
                        }
                    }
                    await sw_data.WriteAsync("]");
                }

                await sw_index.WriteAsync("]");
                await sw_data.WriteAsync("]  ");
                await sw_index.FlushAsync();
                await sw_data.FlushAsync();
            }
        }

        private Dictionary<int, List<TripDataPoint>> ProjectPointsBackwardsInTime(Dictionary<int, List<TripDataPoint>> orig)
        {
            Dictionary<int, HashSet<int>> duplicateFinder = new Dictionary<int, HashSet<int>>();
            Dictionary<int, List<TripDataPoint>> result = new Dictionary<int, List<TripDataPoint>>();
            foreach (int timeslot in orig.Keys)
            {
                foreach (TripDataPoint point in orig[timeslot])
                {
                    int newTime = timeslot - point.next;
                    List<TripDataPoint> resultTimeSlot;
                    HashSet<int> dups;
                    if (!result.TryGetValue(newTime, out resultTimeSlot))
                    {
                        resultTimeSlot = new List<TripDataPoint>();
                        result.Add(newTime, resultTimeSlot);
                    }
                    if (!duplicateFinder.TryGetValue(newTime, out dups))
                    {
                        dups = new HashSet<int>();
                        duplicateFinder.Add(newTime, dups);
                    }
                    if (!dups.Contains(point.routeId))
                    {
                        resultTimeSlot.Add(point);
                        dups.Add(point.routeId);
                    }
                }
            }
            return result;
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
