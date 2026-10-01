import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AddExpenseDialog } from "./add-expense-dialog.tsx";

const members = [
  { personId: "me", name: "Asha", email: "asha@example.com", invited: false },
  { personId: "ben", name: "Ben", email: "ben@example.com", invited: false },
  { personId: "chen", name: "Chen", email: "chen@example.com", invited: false },
];

async function openDialog() {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AddExpenseDialog target={{ groupId: "g1" }} currency="INR" members={members} meId="me" />
    </QueryClientProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Add expense" }));
  const dialog = screen.getByRole("dialog");
  await user.type(within(dialog).getByLabelText("Description"), "Dinner");
  await user.type(within(dialog).getByLabelText(/Amount/), "1200");
  return { user, dialog, save: within(dialog).getByRole("button", { name: "Save expense" }) };
}

/** The live Share shown on each person's row, in member order. */
const shareTexts = (dialog: HTMLElement) =>
  within(dialog).getAllByRole("listitem").map((li) => li.textContent?.match(/₹[\d,.]+|—/)?.[0]);

describe("Add expense: split editor", () => {
  it("splits equally between ticked people, live", async () => {
    const { user, dialog, save } = await openDialog();
    expect(shareTexts(dialog)).toEqual(["₹400.00", "₹400.00", "₹400.00"]);

    await user.click(within(dialog).getByLabelText("Include Chen"));

    expect(shareTexts(dialog)).toEqual(["₹600.00", "₹600.00", "—"]);
    expect(save).toBeEnabled();
  });

  it("Amounts: says what's left to assign and keeps Save off until it adds up", async () => {
    const { user, dialog, save } = await openDialog();
    await user.click(within(dialog).getByRole("tab", { name: "Amounts" }));

    await user.type(within(dialog).getByLabelText("Your amount"), "700");
    await user.type(within(dialog).getByLabelText("Ben's amount"), "300");
    expect(within(dialog).getByText("₹200.00 left to assign")).toBeInTheDocument();
    expect(save).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Chen's amount"), "200");
    expect(within(dialog).queryByText(/left to assign/)).not.toBeInTheDocument();
    expect(shareTexts(dialog)).toEqual(["₹700.00", "₹300.00", "₹200.00"]);
    expect(save).toBeEnabled();
  });

  it("Percent: flags too much, and blank leaves someone out", async () => {
    const { user, dialog, save } = await openDialog();
    await user.click(within(dialog).getByRole("tab", { name: "Percent" }));

    await user.type(within(dialog).getByLabelText("Your percent"), "50");
    await user.type(within(dialog).getByLabelText("Ben's percent"), "51");
    expect(within(dialog).getByText("1.00% too much")).toBeInTheDocument();
    expect(save).toBeDisabled();

    await user.clear(within(dialog).getByLabelText("Ben's percent"));
    await user.type(within(dialog).getByLabelText("Ben's percent"), "50");
    expect(shareTexts(dialog)).toEqual(["₹600.00", "₹600.00", "—"]);
    expect(save).toBeEnabled();
  });

  it("Shares: splits by portions", async () => {
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole("tab", { name: "Shares" }));

    await user.type(within(dialog).getByLabelText("Your shares"), "2");
    await user.type(within(dialog).getByLabelText("Ben's shares"), "1");

    expect(shareTexts(dialog)).toEqual(["₹800.00", "₹400.00", "—"]);
  });
});
