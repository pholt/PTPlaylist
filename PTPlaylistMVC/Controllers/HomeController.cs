using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PTPlaylistMVC.Controllers
{
    public class HomeController : Controller
    {
        static string API_KEY = System.Web.Configuration.WebConfigurationManager.AppSettings["API_KEY"];

        public ActionResult Index()
        {
            ViewBag.API_KEY = API_KEY;
            return View();
        }
    }
}