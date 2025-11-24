import Bild from './Bild222.jpg';

function Card(){
    return(
        <div className="card">
            <img src={Bild} alt="Reasoning"></img>
            <h2>der beste Präsident</h2>
            <p>Ich habe den Friedensnobelpreis erhalten hehe hahaw</p>
        </div>
    );
}

export default Card