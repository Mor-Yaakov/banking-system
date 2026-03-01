using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BankingSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameUserIdToPersonalId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Users",
                newName: "PersonalIdNumber");

            migrationBuilder.RenameIndex(
                name: "IX_Users_UserId",
                table: "Users",
                newName: "IX_Users_PersonalIdNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PersonalIdNumber",
                table: "Users",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Users_PersonalIdNumber",
                table: "Users",
                newName: "IX_Users_UserId");
        }
    }
}
