import React from "react";

const Home = () => {
  return (
    <>
      <div className="hero border-1 pb-3">
        <div className="card bg-dark text-white border-0 mx-3">
          <img
            className="card-img img-fluid"
            src="./assets/Home.png"
            alt="Card"
            height={500}
          />
          <div className="card-img-overlay d-flex align-items-center">
            <div className="container">
              <h5 className="card-title fs-1 text fw-lighter">New Season Arrivals</h5>
              <div style={{ width:"400px", height:"120px", fontWeight:"bold"}}>
                <p style={{ fontFamily: "TT Ramilas", fontSize: "+3em" }}>
                  Upcycle, Upload, and Level Up
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
