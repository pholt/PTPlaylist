using Microsoft.VisualStudio.TestTools.UnitTesting;
using PTPlaylistMVC.Interfaces;
using PTPlaylistMVC.Services;
using Microsoft.Azure.Cosmos;
using System;

namespace PTPlaylistTests
{
    [TestClass]
    public class CosmosDbServiceTests
    {
        private ICosmosDbService blankCosmosDbService = new CosmosDbService(new CosmosClient("", ""), "", "");

        [TestMethod]
        public void TestMethod1()
        {
        }
    }
}
