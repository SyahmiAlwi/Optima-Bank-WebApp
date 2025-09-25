import { render, screen, fireEvent } from "@testing-library/react";
import ChatbotWidget from "@/components/Chatbot/ChatbotWidget";

describe("ChatbotWidget", () => {
  it("opens and closes", () => {
    render(<ChatbotWidget />);
    const trigger = screen.getByRole("button", { name: /open optima help/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const close = screen.getByRole("button", { name: /close help/i });
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders topics and shows an answer", () => {
    render(<ChatbotWidget />);
    fireEvent.click(screen.getByRole("button", { name: /open optima help/i }));
    fireEvent.click(screen.getByRole("button", { name: /open about optima bank/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /show answer for what is optima bank/i })
    );
    expect(
      screen.getByText(/Optima Bank is a digital banking web application/i)
    ).toBeInTheDocument();
  });
});


