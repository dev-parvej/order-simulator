import React, { useState, useEffect } from "react";
import { ISymbol } from "../../@types";
import TextInputField from "../pure/TextInputField";
import Slider from "../pure/StepSlider";
import Button from "../pure/Button";

export interface MakeOrderProps {
    symbol: ISymbol;
    defaultPrice: number;
    isMarket: boolean;
    buttonLabel: string;
    customStyle?: string;
    balanceCheck: (price: number, percent: number) => number;
    checkValidity: (price: number, quantity: number) => boolean;
    onSubmitted: (price: number, quantity: number) => void;
}

const MakeOrder: React.FC<MakeOrderProps> = ({ symbol, defaultPrice, isMarket, buttonLabel, checkValidity, onSubmitted, balanceCheck, customStyle }) => {
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [sliderValue, setSliderValue] = useState(0);

    useEffect(() => {
        setPrice(defaultPrice);
    }, [defaultPrice]);

    return (
        <div>
            {isMarket ? (
                <TextInputField type="text" prefix="Price" suffix={symbol.coinB} placeholder="Market" onChange={() => {}} />
            ) : (
                <TextInputField
                    type="number"
                    prefix="Price"
                    suffix={symbol.coinB}
                    value={price}
                    onChange={(value) => {
                        setPrice(value as number);
                    }}
                />
            )}
            <TextInputField
                type="number"
                prefix="Quantity"
                suffix={symbol.coinA}
                value={quantity}
                onChange={(value) => {
                    setQuantity(value as number);
                }}
            />
            <Slider
                value={sliderValue}
                onChange={(value) => {
                    setSliderValue(value);
                    setQuantity(parseFloat(balanceCheck(price, value).toFixed(3)));
                }}
            />
            <Button
                disabled={!checkValidity(price, quantity)}
                label={buttonLabel}
                onClick={() => {
                    onSubmitted(price, quantity);
                }}
                customStyle={customStyle}
            />
        </div>
    );
};

export default MakeOrder;
