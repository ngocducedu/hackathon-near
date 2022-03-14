import React from "react";
import {
    Routes,
    Route,
    withRouter
} from "react-router-dom";

import MarketPlace from "../pages/MarketPlace";
import Auctions from "../pages/Auctions";
import Profile from "../pages/Profile";
import Detail from "../pages/Detail";
import Mating from "../pages/Mating";

function Router() {
    return (
        <Routes>
            <Route path="/" element={<MarketPlace />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/mating" element={<Mating />} />
            <Route path="/detail/:id" element={<Detail />} />
            
        </Routes>
    )
}

export default Router